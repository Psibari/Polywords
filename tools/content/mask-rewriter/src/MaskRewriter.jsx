import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ARC_PHASES,
  PILOT_WORDS,
  REVIEW_CHECKS,
  TRAP_STYLES,
  canApproveWord,
  createEmptyWord,
  slugify,
  synchronizeDerivedFields,
  validateWord,
} from './contentWorkflow.js';

const STORAGE_KEY = 'polywords-content-workflow-v2';
const API = 'http://localhost:8787/api';
const PROVIDER_TIMEOUT_MS = 90000;

const REVIEW_LABELS = {
  realMeaningsTrue: 'Every REAL is legally true',
  meaningFamiliesDistinct: 'Meaning families are distinct',
  trapsLegallyWrong: 'Every trap is legally wrong and guilty-close',
  wordingHuman: 'Wording sounds human',
  noAnswerLeak: 'No tile leaks the answer',
  noFakeObjectActing: 'No fake object acting',
  noRoleTell: 'No wording pattern reveals tile roles',
  semanticSnapPresent: 'At least one Semantic Snap exists',
  sourcesVerified: 'Meaning sources were checked',
};

const palette = {
  bg: '#1A1830',
  panel: '#0F0D2A',
  panel2: '#211A43',
  gold: '#F5C842',
  purple: '#7B2D8B',
  rose: '#9B2D6B',
  white: '#FFFFFF',
  muted: '#B7B0CC',
  danger: '#CC2200',
};

function initialDrafts() {
  return Object.fromEntries(
    PILOT_WORDS.map(({ word, phase }) => [word, createEmptyWord(word, phase)]),
  );
}

function safeParseStoredDrafts() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return stored && typeof stored === 'object' ? stored : initialDrafts();
  } catch {
    return initialDrafts();
  }
}

function makeMeaning(word, index) {
  const suffix = `meaning-${index + 1}`;
  return {
    id: `${word.id}.${suffix}`,
    label: '',
    definition: '',
    source: { name: '', url: '' },
    familiarity: 3,
    snapStrength: 3,
    visibility: word.profile.recommendedPhase === 'boss' && index === 4 ? 'boss-hidden' : 'ordinary',
    approved: false,
    realMasks: [],
    traps: [],
  };
}

function downloadJson(filename, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = Object.assign(document.createElement('a'), { href: url, download: filename });
  anchor.click();
  URL.revokeObjectURL(url);
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Provider request timed out after 90 seconds. Check the terminal for provider errors.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function mergeGeneratedWord(current, generated, rerunIds) {
  const rerun = new Set(rerunIds);
  const generatedByMeaning = new Map((generated.meanings || []).map(meaning => [meaning.id, meaning]));
  return synchronizeDerivedFields({
    ...current,
    editorialStatus: 'draft',
    meanings: current.meanings.map(meaning => {
      const incoming = generatedByMeaning.get(meaning.id);
      if (!incoming) return meaning;
      if (!rerun.size) {
        return {
          ...meaning,
          realMasks: incoming.realMasks || [],
          traps: incoming.traps || [],
        };
      }
      const mergeTiles = (existing, replacements) => {
        const replacementMap = new Map((replacements || []).map(tile => [tile.id, tile]));
        return existing.map(tile => rerun.has(tile.id) ? (replacementMap.get(tile.id) || tile) : tile);
      };
      return {
        ...meaning,
        realMasks: mergeTiles(meaning.realMasks || [], incoming.realMasks),
        traps: mergeTiles(meaning.traps || [], incoming.traps),
      };
    }),
  });
}

function Field({ label, value, onChange, type = 'text', min, max, disabled = false }) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <input
        value={value}
        type={type}
        min={min}
        max={max}
        disabled={disabled}
        onChange={event => onChange(type === 'number' ? Number(event.target.value) : event.target.value)}
        style={styles.input}
      />
    </label>
  );
}

function Rating({ label, value, onChange }) {
  return <Field label={label} value={value} onChange={onChange} type="number" min={1} max={5} />;
}

function TileEditor({ tile, kind, onChange, onReview }) {
  const border = tile.reviewStatus === 'accepted'
    ? palette.gold
    : tile.reviewStatus === 'rejected'
      ? palette.danger
      : palette.purple;
  return (
    <article style={{ ...styles.tile, borderColor: border }}>
      <div style={styles.rowBetween}>
        <span style={styles.badge}>{kind === 'real' ? 'REAL VARIANT' : 'TRAP'}</span>
        <code style={styles.code}>{tile.id}</code>
      </div>
      <Field label="PLAYER TEXT" value={tile.text || ''} onChange={text => onChange({ ...tile, text: text.toUpperCase() })} />
      {kind === 'trap' && (
        <>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>TRAP STYLE</span>
            <select
              value={tile.trapStyle || ''}
              onChange={event => onChange({ ...tile, trapStyle: event.target.value })}
              style={styles.input}
            >
              <option value="">Choose style</option>
              {TRAP_STYLES.map(style => <option key={style}>{style}</option>)}
            </select>
          </label>
          <Field
            label="WHY TEMPTING"
            value={tile.whyTempting || ''}
            onChange={whyTempting => onChange({ ...tile, whyTempting })}
          />
        </>
      )}
      <div style={styles.ratingGrid}>
        {['difficulty', 'snapStrength', 'trapSharpness', 'familiarity', 'hiddenFairness'].map(field => (
          <Rating
            key={field}
            label={field}
            value={tile[field] ?? 3}
            onChange={value => onChange({ ...tile, [field]: value })}
          />
        ))}
      </div>
      <div style={styles.reviewButtons}>
        <button style={styles.acceptButton} onClick={() => onReview('accepted')}>ACCEPT</button>
        <button style={styles.rejectButton} onClick={() => onReview('rejected')}>REJECT</button>
        <span style={styles.muted}>Status: {tile.reviewStatus || 'pending'}</span>
      </div>
    </article>
  );
}

export default function MaskRewriter() {
  const [drafts, setDrafts] = useState(safeParseStoredDrafts);
  const [selectedWord, setSelectedWord] = useState(PILOT_WORDS[0].word);
  const [sourceWords, setSourceWords] = useState([]);
  const [provider, setProvider] = useState('anthropic');
  const [mockMode, setMockMode] = useState(false);
  const [creativity, setCreativity] = useState('balanced');
  const [tweakNotes, setTweakNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [blindTiles, setBlindTiles] = useState([]);
  const importRef = useRef(null);

  const current = synchronizeDerivedFields(drafts[selectedWord] || createEmptyWord(selectedWord, 'flow'));
  const validation = useMemo(() => validateWord(current), [current]);
  const approval = useMemo(() => canApproveWord(current), [current]);
  const rejectedIds = current.meanings.flatMap(meaning =>
    [...(meaning.realMasks || []), ...(meaning.traps || [])]
      .filter(tile => tile.reviewStatus === 'rejected')
      .map(tile => tile.id),
  );
  const allTiles = current.meanings.flatMap(meaning => [
    ...(meaning.realMasks || []),
    ...(meaning.traps || []),
  ]);
  const inventoryReady = current.meanings.length > 0 && current.meanings.every(meaning =>
    meaning.approved &&
    meaning.id &&
    meaning.label &&
    meaning.definition &&
    meaning.source?.name &&
    /^https?:\/\//i.test(meaning.source?.url || ''),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    fetch(`${API}/source-words`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Source load failed')))
      .then(data => setSourceWords(data.words || []))
      .catch(error => setMessage(error.message));
  }, []);

  const saveCurrent = next => {
    const synchronized = synchronizeDerivedFields(typeof next === 'function' ? next(current) : next);
    setDrafts(previous => ({ ...previous, [selectedWord]: synchronized }));
  };

  const updateProfile = (field, value) => saveCurrent({
    ...current,
    editorialStatus: 'draft',
    profile: { ...current.profile, [field]: value },
  });

  const updateMeaning = (index, nextMeaning) => saveCurrent({
    ...current,
    editorialStatus: 'draft',
    meanings: current.meanings.map((meaning, meaningIndex) =>
      meaningIndex === index ? nextMeaning : meaning),
  });

  const addMeaning = () => saveCurrent({
    ...current,
    meanings: [...current.meanings, makeMeaning(current, current.meanings.length)],
  });

  const removeMeaning = index => saveCurrent({
    ...current,
    meanings: current.meanings.filter((_, meaningIndex) => meaningIndex !== index),
  });

  const researchMeanings = async () => {
    if (current.meanings.some(meaning => meaning.realMasks?.length || meaning.traps?.length)) {
      const confirmed = window.confirm('Generating a new inventory will remove the current generated tiles for this word. Continue?');
      if (!confirmed) return;
    }
    setBusy(true);
    setMessage(`Contacting ${mockMode ? 'local mock mode' : provider} for ${current.word} meaning research...`);
    try {
      const response = await fetchWithTimeout(`${API}/research-meanings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: current.word,
          phase: current.profile.recommendedPhase,
          provider,
          mockMode,
          creativity,
          temperature: creativity === 'conservative' ? 0.35 : creativity === 'wild' ? 0.65 : 0.45,
          tweakNotes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || `API ${response.status}`);
      const meanings = Array.isArray(data.inventory?.meanings) ? data.inventory.meanings : [];
      if (!meanings.length) throw new Error('The generator returned no meaning candidates.');
      saveCurrent({
        ...current,
        editorialStatus: 'draft',
        meanings: meanings.map(meaning => ({
          ...meaning,
          approved: false,
          realMasks: [],
          traps: [],
        })),
        reviewChecklist: Object.fromEntries(REVIEW_CHECKS.map(key => [key, false])),
      });
      setMessage(data.warning || `Generated ${meanings.length} meaning candidates for review.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const runGeneration = async rerunOnly => {
    if (!inventoryReady) {
      setMessage('Approve every sourced meaning before generation.');
      return;
    }
    const targets = rerunOnly ? rejectedIds : [];
    if (rerunOnly && !targets.length) {
      setMessage('No rejected tiles are waiting for a surgical rerun.');
      return;
    }
    setBusy(true);
    setMessage(`Contacting ${mockMode ? 'local mock mode' : provider} for ${current.word} tile writing...`);
    try {
      const response = await fetchWithTimeout(`${API}/rewrite-word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: current,
          provider,
          mockMode,
          creativity,
          temperature: creativity === 'conservative' ? 0.45 : creativity === 'wild' ? 1 : 0.75,
          tweakNotes,
          rerunTileIds: targets,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || `API ${response.status}`);
      saveCurrent(mergeGeneratedWord(current, data.word, targets));
      setMessage(data.warning || (rerunOnly ? 'Rejected tiles rerun.' : 'Word draft generated.'));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const updateTile = (meaningIndex, kind, tileIndex, nextTile) => {
    const meaning = current.meanings[meaningIndex];
    const key = kind === 'real' ? 'realMasks' : 'traps';
    updateMeaning(meaningIndex, {
      ...meaning,
      [key]: meaning[key].map((tile, index) => index === tileIndex ? nextTile : tile),
    });
  };

  const createBlindPreview = () => {
    const shuffled = [...allTiles];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
    }
    setBlindTiles(shuffled);
  };

  const approveWord = () => {
    if (!approval.canApprove) {
      setMessage('Resolve blockers, accept every tile, and complete the checklist first.');
      return;
    }
    saveCurrent({ ...current, editorialStatus: 'approved' });
    setMessage(`${current.word} approved for V2 export.`);
  };

  const exportApproved = () => {
    const words = {};
    Object.values(drafts)
      .map(synchronizeDerivedFields)
      .filter(word => word.editorialStatus === 'approved')
      .forEach(word => { words[word.id] = word; });
    downloadJson('POLYWORDS_APPROVED_V2.json', { schemaVersion: 2, words });
  };

  const exportDrafts = () => downloadJson('POLYWORDS_CONTENT_DRAFTS.json', drafts);

  const importDrafts = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Draft file must be an object.');
      setDrafts(parsed);
      const first = Object.keys(parsed)[0];
      if (first) setSelectedWord(first);
      setMessage(`Loaded ${Object.keys(parsed).length} word drafts.`);
    } catch (error) {
      setMessage(`Draft import failed: ${error.message}`);
    }
    event.target.value = '';
  };

  const source = sourceWords.find(item => item.word === selectedWord);
  const approvedCount = Object.values(drafts).filter(word => word.editorialStatus === 'approved').length;

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>LOCAL EDITORIAL TOOL · V2 PILOT</div>
          <h1 style={styles.title}>POLYWORDS CONTENT WORKFLOW</h1>
          <p style={styles.subtitle}>Meaning research → approval → generation → blind review → V2 export</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.secondaryButton} onClick={exportDrafts}>EXPORT DRAFTS</button>
          <button style={styles.secondaryButton} onClick={() => importRef.current?.click()}>IMPORT DRAFTS</button>
          <input ref={importRef} type="file" accept=".json" hidden onChange={importDrafts} />
          <button style={styles.primaryButton} onClick={exportApproved}>EXPORT APPROVED ({approvedCount})</button>
        </div>
      </header>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <h2 style={styles.sectionTitle}>20-WORD PILOT</h2>
          {ARC_PHASES.map(phase => (
            <section key={phase}>
              <div style={styles.phaseLabel}>{phase}</div>
              {PILOT_WORDS.filter(item => item.phase === phase).map(item => {
                const draft = drafts[item.word];
                return (
                  <button
                    key={item.word}
                    onClick={() => { setSelectedWord(item.word); setBlindTiles([]); }}
                    style={{
                      ...styles.wordButton,
                      borderColor: item.word === selectedWord ? palette.gold : 'transparent',
                    }}
                  >
                    <span>{item.word}</span>
                    <span>{draft?.editorialStatus === 'approved' ? '✓' : '○'}</span>
                  </button>
                );
              })}
            </section>
          ))}
        </aside>

        <div style={styles.content}>
          <section style={styles.panel}>
            <div style={styles.rowBetween}>
              <div>
                <div style={styles.eyebrow}>{current.profile.recommendedPhase} · {current.wordType}</div>
                <h2 style={styles.wordTitle}>{current.word}</h2>
              </div>
              <div style={styles.sourceNote}>
                Legacy source: {source ? `${source.legacyRealCount} REAL / ${source.legacyTrapCount} traps` : 'loading'}
              </div>
            </div>
            <div style={styles.profileGrid}>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>RECOMMENDED PHASE</span>
                <select
                  value={current.profile.recommendedPhase}
                  onChange={event => updateProfile('recommendedPhase', event.target.value)}
                  style={styles.input}
                >
                  {ARC_PHASES.map(phase => <option key={phase}>{phase}</option>)}
                </select>
              </label>
              {['snapStrength', 'trapSharpness', 'hiddenFairness', 'familiarity', 'wordComplexity', 'pollyTauntPotential']
                .map(field => (
                  <Rating
                    key={field}
                    label={field}
                    value={current.profile[field]}
                    onChange={value => updateProfile(field, value)}
                  />
                ))}
              <label style={styles.checkLine}>
                <input
                  type="checkbox"
                  checked={current.profile.bossEligible}
                  onChange={event => updateProfile('bossEligible', event.target.checked)}
                />
                Boss eligible
              </label>
              <label style={styles.checkLine}>
                <input
                  type="checkbox"
                  checked={current.profile.tutorialEligible}
                  onChange={event => updateProfile('tutorialEligible', event.target.checked)}
                />
                Tutorial eligible
              </label>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.rowBetween}>
              <div>
                <h2 style={styles.sectionTitle}>1. APPROVE MEANING INVENTORY</h2>
                <p style={styles.muted}>Generate candidates first. Your job is to verify, correct, and approve them.</p>
              </div>
              <div style={styles.controls}>
                <button
                  disabled={busy}
                  style={!busy ? styles.primaryButton : styles.disabledButton}
                  onClick={researchMeanings}
                >
                  {busy ? 'RESEARCHING...' : 'GENERATE MEANING INVENTORY'}
                </button>
                <button style={styles.secondaryButton} onClick={addMeaning}>+ ADD MANUALLY</button>
              </div>
            </div>
            {message && <div style={styles.requestStatus}>{message}</div>}

            {current.meanings.length === 0 && (
              <div style={styles.empty}>
                Click GENERATE MEANING INVENTORY. The generator proposes meanings and source links;
                you verify them before tile writing unlocks.
              </div>
            )}

            {current.meanings.map((meaning, meaningIndex) => (
              <article key={meaning.id} style={styles.meaning}>
                <div style={styles.rowBetween}>
                  <h3 style={styles.meaningTitle}>MEANING {meaningIndex + 1}</h3>
                  <button style={styles.dangerTextButton} onClick={() => removeMeaning(meaningIndex)}>REMOVE</button>
                </div>
                <div style={styles.profileGrid}>
                  <Field
                    label="STABLE MEANING ID"
                    value={meaning.id}
                    onChange={id => updateMeaning(meaningIndex, { ...meaning, id: slugify(id).replace(/-/g, '.') })}
                  />
                  <Field
                    label="EDITORIAL LABEL"
                    value={meaning.label}
                    onChange={label => updateMeaning(meaningIndex, { ...meaning, label })}
                  />
                  <Field
                    label="SHORT DEFINITION"
                    value={meaning.definition}
                    onChange={definition => updateMeaning(meaningIndex, { ...meaning, definition })}
                  />
                  <Field
                    label="SOURCE NAME"
                    value={meaning.source.name}
                    onChange={name => updateMeaning(meaningIndex, { ...meaning, source: { ...meaning.source, name } })}
                  />
                  <Field
                    label="SOURCE URL"
                    value={meaning.source.url}
                    onChange={url => updateMeaning(meaningIndex, { ...meaning, source: { ...meaning.source, url } })}
                  />
                  <Rating
                    label="FAMILIARITY"
                    value={meaning.familiarity}
                    onChange={familiarity => updateMeaning(meaningIndex, { ...meaning, familiarity })}
                  />
                  <Rating
                    label="SNAP STRENGTH"
                    value={meaning.snapStrength}
                    onChange={snapStrength => updateMeaning(meaningIndex, { ...meaning, snapStrength })}
                  />
                  <label style={styles.field}>
                    <span style={styles.fieldLabel}>VISIBILITY</span>
                    <select
                      value={meaning.visibility}
                      onChange={event => updateMeaning(meaningIndex, { ...meaning, visibility: event.target.value })}
                      style={styles.input}
                    >
                      <option value="ordinary">ordinary</option>
                      <option value="boss-hidden">boss-hidden</option>
                    </select>
                  </label>
                </div>
                <label style={styles.approveMeaning}>
                  <input
                    type="checkbox"
                    checked={meaning.approved}
                    onChange={event => updateMeaning(meaningIndex, { ...meaning, approved: event.target.checked })}
                  />
                  I verified that this is a distinct, playable, source-supported meaning.
                </label>

                {(meaning.realMasks.length > 0 || meaning.traps.length > 0) && (
                  <div style={styles.tileGrid}>
                    {meaning.realMasks.map((tile, tileIndex) => (
                      <TileEditor
                        key={tile.id}
                        tile={tile}
                        kind="real"
                        onChange={next => updateTile(meaningIndex, 'real', tileIndex, next)}
                        onReview={reviewStatus => updateTile(meaningIndex, 'real', tileIndex, { ...tile, reviewStatus })}
                      />
                    ))}
                    {meaning.traps.map((tile, tileIndex) => (
                      <TileEditor
                        key={tile.id}
                        tile={tile}
                        kind="trap"
                        onChange={next => updateTile(meaningIndex, 'trap', tileIndex, next)}
                        onReview={reviewStatus => updateTile(meaningIndex, 'trap', tileIndex, { ...tile, reviewStatus })}
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </section>

          <section style={styles.panel}>
            <h2 style={styles.sectionTitle}>2. GENERATE ONE COMPLETE WORD</h2>
            {!inventoryReady && (
              <div style={styles.lockNotice}>
                LOCKED: Generate the meaning inventory, verify every definition/source, and check
                each meaning's approval box.
              </div>
            )}
            {message && <div style={styles.requestStatus}>{message}</div>}
            <div style={styles.controls}>
              <select value={provider} onChange={event => setProvider(event.target.value)} style={styles.input}>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
              <select value={creativity} onChange={event => setCreativity(event.target.value)} style={styles.input}>
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="wild">Wild</option>
              </select>
              <label style={styles.checkLine}>
                <input type="checkbox" checked={mockMode} onChange={event => setMockMode(event.target.checked)} />
                Local mock mode
              </label>
            </div>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>TWEAK NOTES</span>
              <textarea value={tweakNotes} onChange={event => setTweakNotes(event.target.value)} style={styles.textarea} />
            </label>
            <div style={styles.controls}>
              <button
                disabled={!inventoryReady || busy}
                style={inventoryReady && !busy ? styles.primaryButton : styles.disabledButton}
                onClick={() => runGeneration(false)}
              >
                {busy ? 'WRITING...' : 'GENERATE WORD BANK'}
              </button>
              <button
                disabled={!rejectedIds.length || busy}
                style={rejectedIds.length && !busy ? styles.secondaryButton : styles.disabledButton}
                onClick={() => runGeneration(true)}
              >
                RERUN REJECTED ONLY ({rejectedIds.length})
              </button>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.rowBetween}>
              <div>
                <h2 style={styles.sectionTitle}>3. BLIND HIDDEN-TRUTH REVIEW</h2>
                <p style={styles.muted}>Role labels are concealed. Look for tone, length, or comedy tells.</p>
              </div>
              <button disabled={!allTiles.length} style={allTiles.length ? styles.secondaryButton : styles.disabledButton} onClick={createBlindPreview}>
                SHUFFLE BLIND PREVIEW
              </button>
            </div>
            <div style={styles.blindGrid}>
              {blindTiles.map(tile => <div key={tile.id} style={styles.blindTile}>{tile.text}</div>)}
            </div>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.sectionTitle}>4. VALIDATE AND APPROVE WORD</h2>
            <div style={styles.auditGrid}>
              <div>
                <h3 style={styles.blockerTitle}>BLOCKERS ({validation.blockers.length})</h3>
                {validation.blockers.length
                  ? <ul>{validation.blockers.map(issue => <li key={issue}>{issue}</li>)}</ul>
                  : <p style={styles.pass}>No automated blockers.</p>}
              </div>
              <div>
                <h3 style={styles.warningTitle}>WARNINGS ({validation.warnings.length})</h3>
                {validation.warnings.length
                  ? <ul>{validation.warnings.map(issue => <li key={issue}>{issue}</li>)}</ul>
                  : <p style={styles.pass}>No automated warnings.</p>}
              </div>
            </div>

            <div style={styles.checklist}>
              {REVIEW_CHECKS.map(key => (
                <label key={key} style={styles.checkLine}>
                  <input
                    type="checkbox"
                    checked={current.reviewChecklist[key]}
                    onChange={event => saveCurrent({
                      ...current,
                      editorialStatus: 'draft',
                      reviewChecklist: { ...current.reviewChecklist, [key]: event.target.checked },
                    })}
                  />
                  {REVIEW_LABELS[key]}
                </label>
              ))}
            </div>
            <button
              disabled={!approval.canApprove}
              style={approval.canApprove ? styles.primaryButton : styles.disabledButton}
              onClick={approveWord}
            >
              APPROVE {current.word} FOR V2 EXPORT
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: palette.bg,
    color: palette.white,
    fontFamily: '"Arial Narrow", "Roboto Condensed", Arial, sans-serif',
    padding: 24,
    boxSizing: 'border-box',
  },
  header: { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-end', marginBottom: 18 },
  headerActions: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  eyebrow: { color: palette.gold, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 34, margin: '6px 0', letterSpacing: 1 },
  subtitle: { margin: 0, color: palette.muted },
  message: { background: palette.panel2, borderLeft: `4px solid ${palette.gold}`, padding: 12, marginBottom: 16 },
  lockNotice: { background: palette.panel2, borderLeft: `4px solid ${palette.rose}`, padding: 12, margin: '10px 0', color: palette.white },
  requestStatus: { background: palette.panel2, border: `1px solid ${palette.gold}`, borderRadius: 8, padding: 10, margin: '10px 0', color: palette.gold },
  layout: { display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 18, alignItems: 'start' },
  sidebar: { background: palette.panel, borderRadius: 14, padding: 14, position: 'sticky', top: 14 },
  content: { display: 'grid', gap: 18 },
  panel: { background: palette.panel, border: '1px solid rgba(245,200,66,0.16)', borderRadius: 14, padding: 18 },
  sectionTitle: { fontSize: 16, letterSpacing: 1.5, margin: '0 0 10px' },
  phaseLabel: { color: palette.rose, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', margin: '14px 6px 5px' },
  wordButton: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    background: palette.panel2,
    color: palette.white,
    border: '1px solid transparent',
    borderRadius: 8,
    padding: '8px 10px',
    marginBottom: 5,
    cursor: 'pointer',
    fontWeight: 700,
  },
  wordTitle: { fontSize: 40, margin: '4px 0 0', color: palette.gold },
  sourceNote: { color: palette.muted, fontSize: 13 },
  rowBetween: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' },
  profileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginTop: 14 },
  field: { display: 'grid', gap: 5 },
  fieldLabel: { color: palette.muted, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  input: {
    background: palette.panel2,
    color: palette.white,
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 7,
    padding: '9px 10px',
    boxSizing: 'border-box',
    width: '100%',
  },
  textarea: {
    minHeight: 80,
    resize: 'vertical',
    background: palette.panel2,
    color: palette.white,
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 7,
    padding: 10,
  },
  controls: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '12px 0' },
  primaryButton: {
    background: palette.gold,
    color: palette.panel,
    border: 0,
    borderRadius: 8,
    padding: '10px 14px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  secondaryButton: {
    background: 'transparent',
    color: palette.gold,
    border: `1px solid ${palette.gold}`,
    borderRadius: 8,
    padding: '9px 13px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  disabledButton: {
    background: '#39334A',
    color: '#8F899C',
    border: 0,
    borderRadius: 8,
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'not-allowed',
  },
  dangerTextButton: { background: 'none', border: 0, color: '#FF806F', cursor: 'pointer', fontWeight: 800 },
  empty: { color: palette.muted, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, padding: 20, textAlign: 'center' },
  meaning: { background: palette.panel2, borderRadius: 10, padding: 14, marginTop: 12 },
  meaningTitle: { margin: 0, color: palette.gold, fontSize: 14, letterSpacing: 1.2 },
  approveMeaning: { display: 'flex', gap: 8, alignItems: 'center', color: palette.white, marginTop: 12 },
  tileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 16 },
  tile: { background: palette.panel, border: '1px solid', borderRadius: 10, padding: 12 },
  badge: { color: palette.gold, fontSize: 10, letterSpacing: 1.2 },
  code: { color: palette.muted, fontSize: 10 },
  ratingGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(58px, 1fr))', gap: 6, marginTop: 10 },
  reviewButtons: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 },
  acceptButton: { background: palette.gold, color: palette.panel, border: 0, borderRadius: 6, padding: '7px 10px', fontWeight: 800 },
  rejectButton: { background: palette.danger, color: palette.white, border: 0, borderRadius: 6, padding: '7px 10px', fontWeight: 800 },
  muted: { color: palette.muted, fontSize: 13 },
  checkLine: { display: 'flex', gap: 8, alignItems: 'center', color: palette.white },
  blindGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginTop: 14 },
  blindTile: {
    background: palette.panel2,
    border: `1px solid ${palette.purple}`,
    borderRadius: 10,
    padding: 18,
    textAlign: 'center',
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  auditGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, color: palette.muted },
  blockerTitle: { color: '#FF806F', fontSize: 13 },
  warningTitle: { color: palette.gold, fontSize: 13 },
  pass: { color: '#BCE6B7' },
  checklist: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 9, margin: '18px 0' },
};
