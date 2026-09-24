import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { FONTS } from "../constants/fonts";
import DailyCardFace from "./ui/DailyCardFace";
import { dailyCardMaterial } from "../ui/pwDailyMaterials";
import { PW } from "../ui/pwTheme";
import {
  DAILY_CASTLE_LAYOUT,
  DAILY_CASTLE_REFERENCE,
} from "../ui/dailyCastleLayout";

const SQUARE_ARCH = require("../../assets/images/dailycastle/squarearch.png");
const FEATHER_WALL = require("../../assets/images/dailycastle/featherwall.png");
const GATE = require("../../assets/images/dailycastle/gate.png");
const ANSWER_RECESSES = require("../../assets/images/dailycastle/answerwqallrecesses.png");

type Props = {
  visible: boolean;
  onClose: () => void;
};

const CANDIDATES = [
  "SLAP",
  "ASSASSINATION",
  "HIT",
  "SINGLE",
  "SMASH",
  "STRIKE",
];

// Code Lab copy of the arch layout. Change these values while experimenting;
// the live Daily Castle layout remains unchanged.
const CODE_LAB_ARCH = {
  x: 0,
  y: 126,
  width: 430,
  height: 530,
};
const CODE_LAB_RECESSES = { x: 0, y: 590, width: 430, height: 300 };

// This is the real Daily Castle composition rendered in a browser-sized
// reference frame. New coded background pieces should be added as layers here
// so they can be judged against the shipped art and its actual coordinates.
export default function DailyCastleCodeLab({ visible, onClose }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const frameWidth = Math.min(Math.max(windowWidth - 32, 280), 430);
  const scale = frameWidth / DAILY_CASTLE_REFERENCE.width;
  const frameHeight = DAILY_CASTLE_REFERENCE.height * scale;
  const rect = (target: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => ({
    left: target.x * scale,
    top: target.y * scale,
    width: target.width * scale,
    height: target.height * scale,
  });
  const opening = rect(DAILY_CASTLE_LAYOUT.opening);
  const card = DAILY_CASTLE_LAYOUT.card;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>DEVELOPMENT ONLY</Text>
            <Text style={styles.title}>DAILY CASTLE CODE LAB</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close Daily Castle code lab"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.note}>
            This uses the real Daily Castle art and 430x932 reference layout.
            Add coded layers inside the frame, then save in VS Code to see them
            refresh in the browser.
          </Text>

          <View
            style={[styles.frame, { width: frameWidth, height: frameHeight }]}
          >
            <View style={styles.lessonShape} />
            <Image
              source={FEATHER_WALL}
              contentFit="fill"
              style={[styles.absolute, opening]}
            />
            <Image
              source={GATE}
              contentFit="fill"
              style={[styles.absolute, opening]}
            />
            <Image
              source={SQUARE_ARCH}
              contentFit="fill"
              style={[styles.absolute, rect(CODE_LAB_ARCH)]}
            />
            <Image
              source={ANSWER_RECESSES}
              contentFit="fill"
              style={[
                styles.absolute,
                rect(CODE_LAB_RECESSES),
              ]}
            />

            {CANDIDATES.map((label, index) => {
              const slot = DAILY_CASTLE_LAYOUT.answerSlots[index];
              return (
                <View
                  key={label}
                  style={[
                    styles.cardShell,
                    rect({ ...slot, width: card.width, height: card.height }),
                  ]}
                >
                  <LinearGradient
                    colors={dailyCardMaterial.outerGradient}
                    style={styles.cardRim}
                  >
                    <View style={styles.cardFace}>
                      <DailyCardFace label={label} />
                    </View>
                  </LinearGradient>
                </View>
              );
            })}

            <View pointerEvents="none" style={styles.guideLayer}>
              <View style={[styles.guideVertical, { left: frameWidth / 2 }]} />
              <View
                style={[styles.guideHorizontal, { top: frameHeight / 2 }]}
              />
              <View style={[styles.openingBounds, opening]} />
              {DAILY_CASTLE_LAYOUT.answerSlots.map((slot, index) => (
                <View
                  key={index}
                  style={[
                    styles.cardBounds,
                    rect({ ...slot, width: card.width, height: card.height }),
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.readout}>
            <Text style={styles.readoutTitle}>REAL DAILY CASTLE REFERENCE</Text>
            <Text style={styles.readoutText}>Reference: 430 x 932</Text>
            <Text style={styles.readoutText}>Arch: x 0, y 126, 430 x 530</Text>
            <Text style={styles.readoutText}>
              Opening: x 96.7, y 218.3, 245.7 x 354
            </Text>
            <Text style={styles.readoutText}>
              Cards: 146 x 58 at six authored slots
            </Text>
            <Text style={styles.readoutText}>
              Edit the JSX above the styles to add new coded layers.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PW.color.bg },
  header: {
    minHeight: 82,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PW.color.purpleSoft,
    backgroundColor: PW.color.surfaceDeep,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCopy: { flex: 1 },
  kicker: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  title: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    fontSize: 24,
    letterSpacing: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: PW.color.white, fontSize: 30, lineHeight: 32 },
  content: { padding: 16, alignItems: "center" },
  note: {
    width: "100%",
    maxWidth: 620,
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
  },
  frame: {
    overflow: "hidden",
    backgroundColor: PW.color.surfaceDeep,
    borderWidth: 1,
    borderColor: PW.color.goldDark,
  },
  lessonShape: {
    position: "absolute",
    left: 180,
    top: 220,
    width: 180,
    height: 80,
    backgroundColor: "#6E5B70",
    borderWidth: 4,
    borderColor: "#F5C842",
    borderRadius: 12,
    zIndex: 10,
  },
  absolute: { position: "absolute" },
  cardShell: {
    position: "absolute",
    borderRadius: dailyCardMaterial.outerRadius,
    shadowColor: dailyCardMaterial.shadowColor,
    shadowOpacity: dailyCardMaterial.shadowOpacity,
    shadowRadius: dailyCardMaterial.shadowRadius,
    shadowOffset: dailyCardMaterial.shadowOffset,
    elevation: dailyCardMaterial.elevation,
  },
  cardRim: {
    flex: 1,
    borderRadius: dailyCardMaterial.outerRadius,
    padding: dailyCardMaterial.frameWidth,
  },
  cardFace: {
    flex: 1,
    borderRadius: dailyCardMaterial.innerRadius,
    backgroundColor: dailyCardMaterial.innerFace,
    overflow: "hidden",
  },
  guideLayer: StyleSheet.absoluteFill,
  guideVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(245,200,66,0.4)",
  },
  guideHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(245,200,66,0.4)",
  },
  openingBounds: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(76,175,80,0.8)",
  },
  cardBounds: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.75)",
  },
  readout: {
    width: "100%",
    maxWidth: 620,
    marginTop: 14,
    padding: 14,
    backgroundColor: PW.color.surfaceDeep,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
  },
  readoutTitle: {
    color: PW.color.gold,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  readoutText: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    lineHeight: 20,
  },
});
