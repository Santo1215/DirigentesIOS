import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function WaveBackground() {
  return (
    <Svg
      width="100%"
      height="150"
      viewBox="10 0 500 1200"
      
      preserveAspectRatio="xMidYMin slice"
    style={[StyleSheet.absoluteFillObject, { top: 'auto', bottom: 20 }]}
  >
    <Path
d="M 0,200 L 0,75 C 33.9,65.6 67.8,56.2 94.3,54.3 C 120.8,52.4 139.9,58 175.3,81.7 C 210.7,105.4 262.3,147.2 294.7,156 C 327,164.8 340,140.7 368.3,138.3 C 396.7,136 440.3,155.3 483.7,163.7 C 527,172 570,169.3 613,156.7 C 656,144 699,121.3 742,115 C 785,108.7 828,118.7 871,125.3 C 914,132 957,135.3 1000,131.7 C 1043,128 1086,117.3 1129,108.7 C 1172,100 1215,93.3 1258,95 C 1301,96.7 1344,106.7 1387,121.7 C 1430,136.7 1473,156.7 1516,161.7 C 1559,166.7 1602,156.7 1645,148.3 C 1688,140 1731,133.3 1764.3,131.7 C 1797.7,130 1821.3,133.3 1845,136.7 L 1845,200 L 0,200 Z"      fill="#FFA24C"
    />
  </Svg>
)
};