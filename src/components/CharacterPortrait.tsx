import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect, Polygon } from 'react-native-svg';
import { AvatarSpec } from '../types';

export function CharacterPortrait({ spec, size = 64 }: { spec: AvatarSpec; size?: number }) {
  const s = (v: number) => (v * size) / 64;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={31} fill="#141b2b" stroke="#2a3650" strokeWidth={s(1)} />
      {spec.female ? (
        <>
          <Path d={`M ${s(14)} ${s(56)} Q ${s(32)} ${s(36)} ${s(50)} ${s(56)} Z`} fill={spec.kurta} />
          <Ellipse cx={s(32)} cy={s(30)} rx={s(16)} ry={s(15)} fill="#241a12" />
          <Ellipse cx={s(32)} cy={s(38)} rx={s(15)} ry={s(10)} fill="#241a12" />
        </>
      ) : (
        <Path d={`M ${s(12)} ${s(58)} Q ${s(32)} ${s(36)} ${s(52)} ${s(58)} Z`} fill={spec.kurta} />
      )}
      <Circle cx={s(32)} cy={s(30)} r={s(12)} fill={spec.skin} />
      {spec.female && <Path d={`M ${s(19)} ${s(22)} Q ${s(32)} ${s(8)} ${s(45)} ${s(22)} Q ${s(40)} ${s(14)} ${s(32)} ${s(14)} Q ${s(24)} ${s(14)} ${s(19)} ${s(22)}`} fill="#241a12" />}

      {spec.beard === 'white' && <Path d={`M ${s(20)} ${s(32)} Q ${s(21)} ${s(46)} ${s(32)} ${s(46)} Q ${s(43)} ${s(46)} ${s(44)} ${s(32)} Q ${s(38)} ${s(36)} ${s(32)} ${s(36)} Q ${s(26)} ${s(36)} ${s(20)} ${s(32)}`} fill="#f2f2f2" />}
      {spec.beard === 'dark' && <Path d={`M ${s(20)} ${s(32)} Q ${s(21)} ${s(45)} ${s(32)} ${s(45)} Q ${s(43)} ${s(45)} ${s(44)} ${s(32)} Q ${s(38)} ${s(36)} ${s(32)} ${s(36)} Q ${s(26)} ${s(36)} ${s(20)} ${s(32)}`} fill="#2b2b2b" />}
      {spec.beard === 'stubble' && <Path d={`M ${s(21)} ${s(34)} Q ${s(23)} ${s(43)} ${s(32)} ${s(43)} Q ${s(41)} ${s(43)} ${s(43)} ${s(34)} Q ${s(32)} ${s(47)} ${s(21)} ${s(34)}`} fill="#00000033" />}

      <Circle cx={s(27)} cy={s(28)} r={s(1.4)} fill="#222" />
      <Circle cx={s(37)} cy={s(28)} r={s(1.4)} fill="#222" />
      {spec.glasses && (
        <>
          <Circle cx={s(27)} cy={s(28)} r={s(4)} fill="none" stroke="#333" strokeWidth={s(1)} />
          <Circle cx={s(37)} cy={s(28)} r={s(4)} fill="none" stroke="#333" strokeWidth={s(1)} />
          <Path d={`M ${s(31)} ${s(28)} L ${s(33)} ${s(28)}`} stroke="#333" strokeWidth={s(1)} />
        </>
      )}
      {spec.tilak && <Path d={`M ${s(32)} ${s(20)} L ${s(32)} ${s(25)}`} stroke="#c23" strokeWidth={s(1.6)} />}

      {spec.hat === 'pagdi' && (
        <>
          <Path d={`M ${s(17)} ${s(20)} Q ${s(32)} ${s(4)} ${s(47)} ${s(20)} Q ${s(32)} ${s(14)} ${s(17)} ${s(20)}`} fill={spec.hatColor} />
          <Circle cx={s(46)} cy={s(18)} r={s(3)} fill={spec.hatColor} />
        </>
      )}
      {spec.hat === 'cap' && (
        <>
          <Path d={`M ${s(18)} ${s(21)} L ${s(46)} ${s(21)} L ${s(44)} ${s(9)} L ${s(20)} ${s(9)} Z`} fill={spec.hatColor} />
          <Rect x={s(16)} y={s(21)} width={s(32)} height={s(3)} fill={spec.hatColor} />
        </>
      )}
      {spec.hat === 'crown' && (
        <Polygon points={`${s(16)},${s(18)} ${s(22)},${s(6)} ${s(29)},${s(13)} ${s(32)},${s(3)} ${s(35)},${s(13)} ${s(42)},${s(6)} ${s(48)},${s(18)}`} fill={spec.hatColor} stroke="#8a6d14" strokeWidth={s(0.8)} />
      )}
      {spec.hat === 'armycap' && (
        <>
          <Path d={`M ${s(18)} ${s(20)} Q ${s(32)} ${s(8)} ${s(46)} ${s(20)} Z`} fill={spec.hatColor} />
          <Rect x={s(14)} y={s(20)} width={s(38)} height={s(3)} fill={spec.hatColor} />
          <Path d={`M ${s(32)} ${s(13)} L ${s(33)} ${s(17)} L ${s(31)} ${s(17)} Z`} fill="#e6b422" />
        </>
      )}
      {spec.hat === 'muffler' && (
        <>
          <Path d={`M ${s(16)} ${s(24)} Q ${s(32)} ${s(16)} ${s(48)} ${s(24)}`} stroke={spec.hatColor} strokeWidth={s(5)} fill="none" />
          <Rect x={s(42)} y={s(26)} width={s(5)} height={s(14)} rx={s(2)} fill={spec.hatColor} />
        </>
      )}
      {spec.hat === 'topknot' && (
        <>
          <Path d={`M ${s(18)} ${s(20)} Q ${s(32)} ${s(8)} ${s(46)} ${s(20)} Z`} fill={spec.hatColor} />
          <Circle cx={s(32)} cy={s(7)} r={s(4)} fill={spec.hatColor} />
        </>
      )}
      {spec.hat === 'saffronhood' && <Ellipse cx={s(32)} cy={s(18)} rx={s(15)} ry={s(11)} fill={spec.hatColor} />}
      {spec.hat === 'coiffure' && <Path d={`M ${s(18)} ${s(21)} Q ${s(24)} ${s(6)} ${s(38)} ${s(10)} Q ${s(46)} ${s(12)} ${s(46)} ${s(21)} Q ${s(38)} ${s(13)} ${s(26)} ${s(17)} Q ${s(20)} ${s(18)} ${s(18)} ${s(21)}`} fill={spec.hatColor} />}
      {spec.hat === 'whitestreak' && (
        <>
          <Path d={`M ${s(19)} ${s(22)} Q ${s(32)} ${s(9)} ${s(45)} ${s(22)} Q ${s(40)} ${s(13)} ${s(32)} ${s(13)} Q ${s(24)} ${s(13)} ${s(19)} ${s(22)}`} fill="#241a12" />
          <Path d={`M ${s(24)} ${s(14)} Q ${s(32)} ${s(11)} ${s(40)} ${s(15)}`} stroke="#eee" strokeWidth={s(3)} fill="none" />
        </>
      )}
      {spec.hat === 'scarf' && <Path d={`M ${s(14)} ${s(58)} Q ${s(32)} ${s(36)} ${s(50)} ${s(58)} L ${s(46)} ${s(58)} Q ${s(32)} ${s(42)} ${s(18)} ${s(58)} Z`} fill={spec.hatColor} />}
    </Svg>
  );
}
