import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePolybookTuning } from './polybookTuning';

// DEV-ONLY live tuning control for the Polybook spread — lets Pete dial in
// the page insets directly on a real device instead of a code-edit-reload
// cycle per nudge. Remove once values are locked in and baked back into
// PolybookSpread.tsx, same as DailyScrollTuningPanel.tsx.
//
// The panel sits over the BEATEN seals in the lower-right of the right
// page — exactly the corner that still needs reviewing — so it collapses
// down to a single toggle button with no backdrop, leaving the page fully
// visible for on-device review and screenshots. Defaults to expanded.
export default function PolybookTuningPanel() {
  const [collapsed, setCollapsed] = useState(false);

  const pageTopPct = usePolybookTuning((s) => s.pageTopPct);
  const pageHeightPct = usePolybookTuning((s) => s.pageHeightPct);
  const pageWidthPct = usePolybookTuning((s) => s.pageWidthPct);
  const leftPageLeftPct = usePolybookTuning((s) => s.leftPageLeftPct);
  const rightPageLeftPct = usePolybookTuning((s) => s.rightPageLeftPct);
  const contentScale = usePolybookTuning((s) => s.contentScale);
  const sealSize = usePolybookTuning((s) => s.sealSize);
  const quillOffsetX = usePolybookTuning((s) => s.quillOffsetX);
  const quillOffsetY = usePolybookTuning((s) => s.quillOffsetY);
  const quillAngle = usePolybookTuning((s) => s.quillAngle);
  const quillScale = usePolybookTuning((s) => s.quillScale);
  const quillOpacity = usePolybookTuning((s) => s.quillOpacity);
  const setLayout = usePolybookTuning((s) => s.setLayout);

  if (!__DEV__) return null;

  const dump = () => {
    console.log(
      'POLYBOOK_LAYOUT =',
      JSON.stringify(
        {
          pageTopPct,
          pageHeightPct,
          pageWidthPct,
          leftPageLeftPct,
          rightPageLeftPct,
          contentScale,
          sealSize,
          quillOffsetX,
          quillOffsetY,
          quillAngle,
          quillScale,
          quillOpacity,
        },
        null,
        2,
      ),
    );
  };

  return (
    <View style={styles.anchor} pointerEvents="box-none">
      <Pressable
        onPress={() => setCollapsed((value) => !value)}
        style={styles.toggle}
        hitSlop={8}
      >
        <Text style={styles.toggleText}>{collapsed ? '▸' : '×'}</Text>
      </Pressable>

      {!collapsed && (
        <View style={styles.root}>
          <Text style={styles.section}>PAGE</Text>
          <Row
            label="TOP"
            value={`${pageTopPct.toFixed(1)}%`}
            onDec={() => setLayout({ pageTopPct: pageTopPct - 0.5 })}
            onInc={() => setLayout({ pageTopPct: pageTopPct + 0.5 })}
          />
          <Row
            label="HEIGHT"
            value={`${pageHeightPct.toFixed(1)}%`}
            onDec={() => setLayout({ pageHeightPct: pageHeightPct - 0.5 })}
            onInc={() => setLayout({ pageHeightPct: pageHeightPct + 0.5 })}
          />
          <Row
            label="WIDTH"
            value={`${pageWidthPct.toFixed(1)}%`}
            onDec={() => setLayout({ pageWidthPct: pageWidthPct - 0.5 })}
            onInc={() => setLayout({ pageWidthPct: pageWidthPct + 0.5 })}
          />
          <Row
            label="LEFT X"
            value={`${leftPageLeftPct.toFixed(1)}%`}
            onDec={() => setLayout({ leftPageLeftPct: leftPageLeftPct - 0.5 })}
            onInc={() => setLayout({ leftPageLeftPct: leftPageLeftPct + 0.5 })}
          />
          <Row
            label="RIGHT X"
            value={`${rightPageLeftPct.toFixed(1)}%`}
            onDec={() => setLayout({ rightPageLeftPct: rightPageLeftPct - 0.5 })}
            onInc={() => setLayout({ rightPageLeftPct: rightPageLeftPct + 0.5 })}
          />
          <Row
            label="SCALE"
            value={`${contentScale.toFixed(2)}x`}
            onDec={() => setLayout({ contentScale: contentScale - 0.02 })}
            onInc={() => setLayout({ contentScale: contentScale + 0.02 })}
          />
          <Row
            label="SEAL"
            value={`${Math.round(sealSize)}`}
            onDec={() => setLayout({ sealSize: sealSize - 2 })}
            onInc={() => setLayout({ sealSize: sealSize + 2 })}
          />

          <Text style={styles.section}>QUILL</Text>
          <Row
            label="X"
            value={`${Math.round(quillOffsetX)}`}
            onDec={() => setLayout({ quillOffsetX: quillOffsetX - 5 })}
            onInc={() => setLayout({ quillOffsetX: quillOffsetX + 5 })}
          />
          <Row
            label="Y"
            value={`${Math.round(quillOffsetY)}`}
            onDec={() => setLayout({ quillOffsetY: quillOffsetY - 5 })}
            onInc={() => setLayout({ quillOffsetY: quillOffsetY + 5 })}
          />
          <Row
            label="ANGLE"
            value={`${Math.round(quillAngle)}°`}
            onDec={() => setLayout({ quillAngle: quillAngle - 5 })}
            onInc={() => setLayout({ quillAngle: quillAngle + 5 })}
          />
          <Row
            label="SCALE"
            value={`${quillScale.toFixed(2)}x`}
            onDec={() => setLayout({ quillScale: quillScale - 0.05 })}
            onInc={() => setLayout({ quillScale: quillScale + 0.05 })}
          />
          <Row
            label="OPACITY"
            value={quillOpacity.toFixed(2)}
            onDec={() => setLayout({ quillOpacity: quillOpacity - 0.02 })}
            onInc={() => setLayout({ quillOpacity: quillOpacity + 0.02 })}
          />

          <Pressable onPress={dump} style={styles.dumpBtn} hitSlop={8}>
            <Text style={styles.dumpText}>DUMP</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Row({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onDec} style={styles.btn} hitSlop={8}>
        <Text style={styles.btnText}>-</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable onPress={onInc} style={styles.btn} hitSlop={8}>
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pure positioning wrapper — no background of its own, so a collapsed
  // panel renders nothing but the toggle chip. The toggle is always the
  // first (topmost) child, right-aligned, so it sits at the top-right of
  // this anchor area regardless of whether the panel body is expanded.
  anchor: {
    position: 'absolute',
    bottom: 70,
    right: 14,
    zIndex: 99,
    alignItems: 'flex-end',
    gap: 4,
  },
  toggle: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    color: '#FFC800',
    fontSize: 14,
    fontWeight: '700',
  },
  root: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 6,
    padding: 6,
    gap: 2,
  },
  section: {
    color: '#FFC800',
    fontSize: 10,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: '#00FF88',
    fontSize: 10,
    width: 46,
  },
  btn: {
    backgroundColor: '#333',
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 14,
  },
  value: {
    color: '#00FF88',
    fontSize: 11,
    width: 40,
    textAlign: 'center',
  },
  dumpBtn: {
    marginTop: 4,
    backgroundColor: '#333',
    borderRadius: 4,
    paddingVertical: 5,
    alignItems: 'center',
  },
  dumpText: {
    color: '#FFC800',
    fontSize: 11,
    fontWeight: '700',
  },
});
