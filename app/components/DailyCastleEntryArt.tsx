import React, { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import {
  DAILY_CASTLE_CANVAS,
  DAILY_CASTLE_LEFT_TOWER,
  DAILY_CASTLE_OPENING,
  DAILY_GATE_CLOSED,
} from '../ui/dailyCastleScene';

const CASTLE_ARCH = require('../../assets/images/dailycastle/ARCHNEW.png');
const GATE = require('../../assets/images/dailycastle/gate_scroll.png');

/**
 * The castle crown above the Daily entry card: the same ARCHNEW art and
 * closed gate the play screen uses, cropped from the tower tops down. It
 * fills whatever box its parent gives it.
 */
export default function DailyCastleEntryArt() {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const k = width / DAILY_CASTLE_CANVAS.width;
  // Start the crop at the tower tops; the sky above them is empty canvas.
  const top = -DAILY_CASTLE_LEFT_TOWER.crownTop * k;

  return (
    <View pointerEvents="none" style={styles.root} onLayout={onLayout}>
      {width > 0 && (
        <>
          <View
            style={[
              styles.opening,
              {
                left: DAILY_CASTLE_OPENING.x * k,
                top: top + DAILY_CASTLE_OPENING.y * k,
                width: DAILY_CASTLE_OPENING.width * k,
                height: DAILY_CASTLE_OPENING.height * k,
              },
            ]}
          >
            <Image
              source={GATE}
              resizeMode="stretch"
              style={{
                position: 'absolute',
                left: (DAILY_GATE_CLOSED.x - DAILY_CASTLE_OPENING.x) * k,
                top: (DAILY_GATE_CLOSED.y - DAILY_CASTLE_OPENING.y) * k,
                width: DAILY_GATE_CLOSED.width * k,
                height: DAILY_GATE_CLOSED.height * k,
              }}
            />
          </View>
          <Image
            source={CASTLE_ARCH}
            resizeMode="stretch"
            style={{
              position: 'absolute',
              left: 0,
              top,
              width,
              height: DAILY_CASTLE_CANVAS.height * k,
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  opening: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
