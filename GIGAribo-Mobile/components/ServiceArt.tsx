import React from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgGradient,
  Line,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * Small illustrated scenes for each service. They are drawn with SVG shapes,
 * so they stay sharp at any size and need no image files.
 *
 * Every scene is drawn on a 200 x 120 canvas and scaled to fill its container.
 */

// A four-point sparkle.
function sparkle(cx: number, cy: number, r: number) {
  return `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`;
}

// A water drop.
function drop(cx: number, cy: number, s = 1) {
  return `M${cx} ${cy - 6 * s} C${cx + 5 * s} ${cy} ${cx + 5 * s} ${cy + 5 * s} ${cx} ${cy + 5 * s} C${cx - 5 * s} ${cy + 5 * s} ${cx - 5 * s} ${cy} ${cx} ${cy - 6 * s} Z`;
}

function Gradient({ id, from, to }: { id: string; from: string; to: string }) {
  return (
    <Defs>
      <SvgGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={from} />
        <Stop offset="1" stopColor={to} />
      </SvgGradient>
    </Defs>
  );
}

function Roofing() {
  return (
    <>
      <Gradient id="art-roof" from="#8EC5FF" to="#FFE6D0" />
      <Rect width="200" height="120" fill="url(#art-roof)" />
      <Circle cx="165" cy="26" r="22" fill="#FFD166" opacity={0.3} />
      <Circle cx="165" cy="26" r="14" fill="#FFD166" />
      <Ellipse cx="40" cy="24" rx="18" ry="7" fill="#FFFFFF" opacity={0.9} />
      <Ellipse cx="54" cy="19" rx="12" ry="7" fill="#FFFFFF" opacity={0.9} />
      <Rect y="98" width="200" height="22" fill="#7BC47F" />
      <Rect x="122" y="30" width="10" height="22" fill="#8A4B3C" />
      <Rect x="58" y="62" width="84" height="40" fill="#FFF6EA" />
      <Polygon points="48,64 100,28 152,64" fill="#C4533D" />
      <Path d="M61 56 L139 56 M71 48 L129 48 M83 40 L117 40" stroke="#A93F2D" strokeWidth="2" opacity={0.6} />
      <Rect x="92" y="78" width="16" height="24" rx="2" fill="#5B7DB1" />
      <Circle cx="105" cy="91" r="1.4" fill="#FFD166" />
      <Rect x="66" y="72" width="16" height="14" fill="#BDE3FF" stroke="#FFFFFF" strokeWidth="2" />
      <Rect x="118" y="72" width="16" height="14" fill="#BDE3FF" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M32 104 L46 58 M42 104 L56 58" stroke="#B8793E" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M35 94 L45 94 M38 84 L48 84 M41 74 L51 74 M44 64 L54 64" stroke="#B8793E" strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
}

function PipeRepair() {
  return (
    <>
      <Gradient id="art-pipe" from="#FFD9B8" to="#FFF0E2" />
      <Rect width="200" height="120" fill="url(#art-pipe)" />
      <Rect y="96" width="200" height="24" fill="#FFFFFF" opacity={0.45} />
      <Rect x="0" y="50" width="120" height="16" rx="3" fill="#8FA3BF" />
      <Rect x="0" y="52" width="120" height="4" fill="#B8C7DC" />
      <Rect x="104" y="50" width="16" height="50" fill="#8FA3BF" />
      <Rect x="104" y="56" width="4" height="44" fill="#B8C7DC" />
      <Rect x="40" y="46" width="10" height="24" rx="3" fill="#5E7391" />
      <Rect x="98" y="46" width="28" height="9" rx="3" fill="#5E7391" />
      <Ellipse cx="70" cy="67" rx="5" ry="2.5" fill="#4BB3F5" />
      <Path d={drop(70, 78, 1)} fill="#4BB3F5" />
      <Path d={drop(72, 92, 0.8)} fill="#4BB3F5" opacity={0.85} />
      <Ellipse cx="72" cy="106" rx="24" ry="5" fill="#7CC8F8" opacity={0.8} />
      <Polygon points="139.2,58.0 142.5,55.7 170.0,95.1 166.7,97.4" fill="#FF8A3D" stroke="#FF8A3D" strokeWidth="4" strokeLinejoin="round" />
      <Circle cx="138.5" cy="53.6" r="11" fill="#FF8A3D" />
      <Polygon points="127.2,44.4 133.8,39.9 140.7,49.7 134.1,54.3" fill="#FFE6CE" />
      <Circle cx="162.6" cy="88.0" r="1.8" fill="#FFE6CE" />
      <Path d={sparkle(172, 30, 7)} fill="#FFFFFF" />
      <Path d={sparkle(22, 28, 5)} fill="#FFFFFF" />
    </>
  );
}

function HouseCleaning() {
  return (
    <>
      <Gradient id="art-house" from="#CFE8FF" to="#F6E4FF" />
      <Rect width="200" height="120" fill="url(#art-house)" />
      <Rect y="96" width="200" height="24" fill="#FFFFFF" opacity={0.55} />
      <Path d="M44 70 L96 70 L90 104 L50 104 Z" fill="#3E8BFF" />
      <Rect x="42" y="66" width="56" height="6" rx="3" fill="#2B6FD8" />
      <Path d="M50 70 Q70 44 90 70" stroke="#5E7391" strokeWidth="2.5" fill="none" />
      <Circle cx="55" cy="64" r="6" fill="#FFFFFF" />
      <Circle cx="70" cy="60" r="8" fill="#FFFFFF" />
      <Circle cx="84" cy="64" r="6" fill="#FFFFFF" />
      <Line x1="142" y1="16" x2="122" y2="90" stroke="#C79A5A" strokeWidth="4" strokeLinecap="round" />
      <Path d="M108 90 L134 90 L138 106 L104 106 Z" fill="#FFFFFF" stroke="#CFD8E6" strokeWidth="1.5" />
      <Path d="M112 94 L110 106 M119 94 L118 106 M126 94 L126 106 M133 94 L134 106" stroke="#DCE4F0" strokeWidth="1.5" />
      <Circle cx="28" cy="42" r="7" fill="#FFFFFF" opacity={0.7} stroke="#9CCBFF" strokeWidth="1.2" />
      <Circle cx="172" cy="62" r="9" fill="#FFFFFF" opacity={0.7} stroke="#9CCBFF" strokeWidth="1.2" />
      <Circle cx="156" cy="28" r="5" fill="#FFFFFF" opacity={0.7} stroke="#9CCBFF" strokeWidth="1.2" />
      <Circle cx="20" cy="80" r="4" fill="#FFFFFF" opacity={0.7} stroke="#9CCBFF" strokeWidth="1.2" />
      <Path d={sparkle(100, 34, 9)} fill="#FFD166" />
      <Path d={sparkle(176, 34, 6)} fill="#FFFFFF" />
      <Path d={sparkle(60, 28, 6)} fill="#FFFFFF" />
    </>
  );
}

function BathroomCleaning() {
  return (
    <>
      <Gradient id="art-bath" from="#D8F1FF" to="#E8F9F0" />
      <Rect width="200" height="120" fill="url(#art-bath)" />
      <Path
        d="M0 20 L200 20 M0 40 L200 40 M0 60 L200 60 M0 80 L200 80 M20 0 L20 120 M60 0 L60 120 M100 0 L100 120 M140 0 L140 120 M180 0 L180 120"
        stroke="#FFFFFF"
        strokeWidth="2"
        opacity={0.7}
      />
      <Path d="M152 16 L152 36 Q152 44 144 44 L134 44" stroke="#9FB3CF" strokeWidth="6" fill="none" strokeLinecap="round" />
      <Circle cx="152" cy="14" r="5" fill="#7F95B4" />
      <Rect x="24" y="64" width="152" height="8" rx="4" fill="#E6EEF9" />
      <Path d="M30 72 L170 72 L162 98 Q160 104 152 104 L48 104 Q40 104 38 98 Z" fill="#FFFFFF" stroke="#C9D8EC" strokeWidth="1.5" />
      <Circle cx="52" cy="109" r="4" fill="#9FB3CF" />
      <Circle cx="148" cy="109" r="4" fill="#9FB3CF" />
      <Circle cx="58" cy="62" r="10" fill="#FFFFFF" stroke="#D6E6F7" strokeWidth="1.2" />
      <Circle cx="76" cy="57" r="12" fill="#FFFFFF" stroke="#D6E6F7" strokeWidth="1.2" />
      <Circle cx="118" cy="55" r="13" fill="#FFFFFF" stroke="#D6E6F7" strokeWidth="1.2" />
      <Circle cx="138" cy="61" r="10" fill="#FFFFFF" stroke="#D6E6F7" strokeWidth="1.2" />
      <Circle cx="98" cy="60" r="10" fill="#FFFFFF" stroke="#D6E6F7" strokeWidth="1.2" />
      <Ellipse cx="92" cy="52" rx="9" ry="6" fill="#FFD166" />
      <Circle cx="99" cy="44" r="5" fill="#FFD166" />
      <Polygon points="103,43 108,45 103,47" fill="#FF9F43" />
      <Circle cx="100" cy="42.5" r="1" fill="#2B3A55" />
      <Path d={sparkle(40, 34, 8)} fill="#FFFFFF" />
      <Path d={sparkle(172, 56, 6)} fill="#FFD166" />
      <Path d={sparkle(116, 26, 6)} fill="#FFFFFF" />
    </>
  );
}

function DeepClean() {
  return (
    <>
      <Gradient id="art-deep" from="#E4DBFF" to="#FFE3F1" />
      <Rect width="200" height="120" fill="url(#art-deep)" />
      <Path d={sparkle(160, 72, 17)} fill="#FFD166" />
      <Path d={sparkle(36, 40, 10)} fill="#FFFFFF" />
      <Path d={sparkle(46, 88, 7)} fill="#FFD166" />
      <Path d={sparkle(172, 28, 7)} fill="#FFFFFF" />
      <Circle cx="28" cy="68" r="6" fill="#FFFFFF" opacity={0.7} stroke="#C9B8FF" strokeWidth="1.2" />
      <Circle cx="64" cy="26" r="4" fill="#FFFFFF" opacity={0.7} stroke="#C9B8FF" strokeWidth="1.2" />
      <Rect x="80" y="56" width="36" height="50" rx="8" fill="#4DC4B5" />
      <Rect x="84" y="72" width="28" height="30" rx="5" fill="#9AE6DC" />
      <Rect x="92" y="44" width="12" height="14" fill="#2A9D8F" />
      <Rect x="86" y="32" width="36" height="13" rx="4" fill="#2A9D8F" />
      <Rect x="120" y="35" width="10" height="6" rx="2" fill="#1F7A70" />
      <Path d="M96 48 L84 58 L88 62 L100 54 Z" fill="#1F7A70" />
      <Circle cx="138" cy="38" r="2.5" fill="#FFFFFF" />
      <Circle cx="146" cy="33" r="2" fill="#FFFFFF" />
      <Circle cx="146" cy="44" r="2" fill="#FFFFFF" />
      <Circle cx="154" cy="39" r="1.8" fill="#FFFFFF" />
    </>
  );
}

function Landscaping() {
  return (
    <>
      <Gradient id="art-garden" from="#BDE7FF" to="#E9FAD9" />
      <Rect width="200" height="120" fill="url(#art-garden)" />
      <Circle cx="162" cy="24" r="21" fill="#FFD166" opacity={0.3} />
      <Circle cx="162" cy="24" r="13" fill="#FFD166" />
      <Ellipse cx="96" cy="22" rx="16" ry="6" fill="#FFFFFF" opacity={0.85} />
      <Ellipse cx="108" cy="18" rx="10" ry="6" fill="#FFFFFF" opacity={0.85} />
      <Path d="M0 84 Q50 56 100 80 T200 76 L200 120 L0 120 Z" fill="#8FD48F" />
      <Path d="M0 100 Q60 82 120 98 T200 94 L200 120 L0 120 Z" fill="#5DB66A" />
      <Rect x="44" y="58" width="8" height="38" fill="#8B5E3C" />
      <Circle cx="48" cy="46" r="20" fill="#3FA35B" />
      <Circle cx="35" cy="56" r="13" fill="#3FA35B" />
      <Circle cx="61" cy="56" r="13" fill="#3FA35B" />
      <Circle cx="42" cy="40" r="6" fill="#66C27E" />
      <Ellipse cx="150" cy="98" rx="17" ry="10" fill="#3FA35B" />
      <Ellipse cx="146" cy="94" rx="7" ry="4" fill="#66C27E" />
      <Rect x="96" y="62" width="24" height="18" rx="3" fill="#4A90E2" />
      <Rect x="96" y="62" width="24" height="5" rx="2" fill="#3A7BC8" />
      <Path d="M120 68 L138 56 L141 60 L122 74 Z" fill="#4A90E2" />
      <Path d="M96 66 Q84 70 96 78" stroke="#3A7BC8" strokeWidth="2.5" fill="none" />
      <Path d={drop(146, 68, 0.7)} fill="#7CC8F8" />
      <Path d={drop(150, 78, 0.7)} fill="#7CC8F8" />
      <Path d={drop(143, 80, 0.6)} fill="#7CC8F8" />
      <Line x1="80" y1="102" x2="80" y2="112" stroke="#3A8F4F" strokeWidth="1.6" />
      <Circle cx="80" cy="98" r="4.2" fill="#FF7BA9" />
      <Circle cx="80" cy="98" r="1.6" fill="#FFD166" />
      <Line x1="104" y1="104" x2="104" y2="114" stroke="#3A8F4F" strokeWidth="1.6" />
      <Circle cx="104" cy="100" r="4.2" fill="#FFFFFF" />
      <Circle cx="104" cy="100" r="1.6" fill="#FFD166" />
      <Line x1="176" y1="102" x2="176" y2="112" stroke="#3A8F4F" strokeWidth="1.6" />
      <Circle cx="176" cy="98" r="4.2" fill="#FF9F43" />
      <Circle cx="176" cy="98" r="1.6" fill="#FFF2CC" />
    </>
  );
}

function Electrical() {
  const rays = [-180, -150, -120, -90, -60, -30, 0].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const x1 = 100 + Math.cos(rad) * 30;
    const y1 = 48 + Math.sin(rad) * 30;
    const x2 = 100 + Math.cos(rad) * 38;
    const y2 = 48 + Math.sin(rad) * 38;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  });
  return (
    <>
      <Gradient id="art-electric" from="#FFF1B8" to="#FFD9A8" />
      <Rect width="200" height="120" fill="url(#art-electric)" />
      <Circle cx="100" cy="48" r="38" fill="#FFE066" opacity={0.3} />
      <Circle cx="100" cy="48" r="28" fill="#FFE066" opacity={0.45} />
      <Path d={rays.join(' ')} stroke="#F2B705" strokeWidth="3" strokeLinecap="round" />
      <Circle cx="100" cy="48" r="20" fill="#FFE066" stroke="#F2B705" strokeWidth="2" />
      <Path d="M92 52 L96 44 L100 52 L104 44 L108 52" stroke="#F08C00" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      <Path d="M92 66 L108 66 L106 78 L94 78 Z" fill="#D9DEE8" />
      <Rect x="92" y="78" width="16" height="4" rx="2" fill="#9AA5B8" />
      <Rect x="94" y="82" width="12" height="4" rx="2" fill="#7F8BA1" />
      <Path d="M100 86 Q100 106 70 106 Q40 106 40 92" stroke="#3B4A6B" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Rect x="30" y="76" width="20" height="16" rx="3" fill="#3B4A6B" />
      <Rect x="34" y="68" width="3.5" height="8" fill="#9AA5B8" />
      <Rect x="43" y="68" width="3.5" height="8" fill="#9AA5B8" />
      <Path d="M158 34 L146 62 L156 62 L150 88 L172 54 L160 54 L168 34 Z" fill="#FF9F1C" />
      <Path d={sparkle(30, 30, 7)} fill="#FFFFFF" />
      <Path d={sparkle(180, 96, 6)} fill="#FFFFFF" />
    </>
  );
}

function Generic() {
  return (
    <>
      <Gradient id="art-generic" from="#E3EEFF" to="#F5F8FF" />
      <Rect width="200" height="120" fill="url(#art-generic)" />
      <Circle cx="100" cy="60" r="30" fill="#FFFFFF" opacity={0.8} />
      <Path d={sparkle(100, 60, 16)} fill="#2860E8" />
      <Path d={sparkle(52, 32, 7)} fill="#FFFFFF" />
      <Path d={sparkle(156, 90, 8)} fill="#FFFFFF" />
    </>
  );
}

const scenes: Record<string, React.ComponentType> = {
  roofing: Roofing,
  'pipe-repair': PipeRepair,
  'house-cleaning': HouseCleaning,
  'bathroom-cleaning': BathroomCleaning,
  'deep-clean': DeepClean,
  landscaping: Landscaping,
  electrical: Electrical,
};

/**
 * Real photos for services. A service with no entry here falls back to its
 * illustration.
 * To add one: save the image in assets/images/services/ and add a line below.
 */
export const servicePhotos: Record<string, ImageSourcePropType> = {
  roofing: require('@/assets/images/services/roofing.jpg'),
  'pipe-repair': require('@/assets/images/services/pipe-repair.jpg'),
  'house-cleaning': require('@/assets/images/services/house-cleaning.jpg'),
  'bathroom-cleaning': require('@/assets/images/services/bathroom-cleaning.jpg'),
  'deep-clean': require('@/assets/images/services/deep-clean.jpg'),
  landscaping: require('@/assets/images/services/landscaping.jpg'),
  electrical: require('@/assets/images/services/electrical.jpg'),
};

/** Photos for the category tiles on the home page. Categories not listed here show their icon. */
export const categoryPhotos: Record<string, ImageSourcePropType> = {
  carpentry: servicePhotos.roofing,
  plumbing: servicePhotos['pipe-repair'],
  cleaning: servicePhotos['house-cleaning'],
  landscaping: servicePhotos.landscaping,
};

/** Photo (or illustration) for a service, chosen by its id. Fills whatever size its container is given. */
export function ServiceArt({ serviceId, style }: { serviceId: string; style?: StyleProp<ViewStyle> }) {
  const photo = servicePhotos[serviceId];
  if (photo) {
    return (
      <View style={[{ overflow: 'hidden' }, style]}>
        <Image source={photo} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
    );
  }
  const Scene = scenes[serviceId] ?? Generic;
  return (
    <View style={[{ overflow: 'hidden' }, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        <Scene />
      </Svg>
    </View>
  );
}