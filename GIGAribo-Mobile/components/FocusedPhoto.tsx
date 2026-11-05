import React, { useState } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

export type Focus = { x: number; y: number };

/**
 * Where the subject of each service photo sits (x: 0 = left edge, 1 = right edge;
 * y: 0 = top, 1 = bottom). The crop is built around this point so the subject
 * stays in the middle, whatever shape the image box is.
 */
export const serviceFocus: Record<string, Focus> = {
  roofing: { x: 0.66, y: 0.55 },
  'pipe-repair': { x: 0.55, y: 0.42 },
  'house-cleaning': { x: 0.55, y: 0.42 },
  'bathroom-cleaning': { x: 0.5, y: 0.5 },
  'deep-clean': { x: 0.5, y: 0.55 },
  landscaping: { x: 0.45, y: 0.5 },
  electrical: { x: 0.5, y: 0.45 },
  'doctor-consult': { x: 0.7, y: 0.4 },
  'health-checkup': { x: 0.5, y: 0.4 },
  'party-catering': { x: 0.5, y: 0.5 },
  'snack-trays': { x: 0.5, y: 0.5 },
};

/** Same idea for the category tiles (they reuse some of the service photos). */
export const categoryFocus: Record<string, Focus> = {
  carpentry: serviceFocus.roofing,
  plumbing: serviceFocus['pipe-repair'],
  cleaning: serviceFocus['house-cleaning'],
  landscaping: serviceFocus.landscaping,
  health: { x: 0.7, y: 0.4 },
  catering: { x: 0.5, y: 0.5 },
};

// All the service photos are 3:2 (landscape).
const PHOTO_RATIO = 3 / 2;

/**
 * Fills its box with a photo and keeps `focus` in the middle of the visible part.
 * The size is worked out explicitly, so it looks the same on web and on phones.
 */
export function FocusedPhoto({
  source,
  focus = { x: 0.5, y: 0.5 },
  style,
}: {
  source: ImageSourcePropType;
  focus?: Focus;
  style?: StyleProp<ViewStyle>;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  let imageStyle: StyleProp<ImageStyle> = StyleSheet.absoluteFill;
  if (size && size.w > 0 && size.h > 0) {
    const boxIsWider = size.w / size.h > PHOTO_RATIO;
    const imageW = boxIsWider ? size.w : size.h * PHOTO_RATIO;
    const imageH = boxIsWider ? size.w / PHOTO_RATIO : size.h;
    // Put the focus point in the middle of the box, without leaving gaps at the edges.
    const left = Math.min(0, Math.max(size.w - imageW, size.w / 2 - focus.x * imageW));
    const top = Math.min(0, Math.max(size.h - imageH, size.h / 2 - focus.y * imageH));
    imageStyle = { position: 'absolute', left, top, width: imageW, height: imageH };
  }

  return (
    <View
      style={[{ overflow: 'hidden' }, style]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((prev) => (prev && Math.abs(prev.w - width) < 0.5 && Math.abs(prev.h - height) < 0.5 ? prev : { w: width, h: height }));
      }}
    >
      <Image source={source} style={imageStyle} resizeMode="cover" />
    </View>
  );
}