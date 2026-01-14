import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Title, Paragraph, useTheme } from 'react-native-paper';
import Svg, {
  Polygon,
  Circle,
  Line,
  Text as SvgText,
  G,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;
const chartSize = Math.min(screenWidth - 60, 300);
const centerX = chartSize / 2;
const centerY = chartSize / 2;
const maxRadius = chartSize / 2 - 60;

interface SkillData {
  name: string;
  current: number;
  target: number;
  color: string;
}

interface SkillRadarChartProps {
  skills: SkillData[];
  title?: string;
  showTarget?: boolean;
}

export default function SkillRadarChart({
  skills,
  title = '스킬 분석',
  showTarget = true,
}: SkillRadarChartProps) {
  const theme = useTheme();

  // 육각형의 꼭짓점 좌표 계산
  const getPolygonPoints = (radius: number): string => {
    const points: string[] = [];
    const numSides = skills.length;

    for (let i = 0; i < numSides; i++) {
      const angle = (i * 2 * Math.PI) / numSides - Math.PI / 2; // -90도에서 시작
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    return points.join(' ');
  };

  // 각 레벨별 가이드 라인 생성
  const renderGuideLines = () => {
    const levels = [20, 40, 60, 80, 100];

    return levels.map((level, index) => {
      const radius = (level / 100) * maxRadius;
      const opacity = 0.1 + index * 0.05;

      return (
        <Polygon
          key={level}
          points={getPolygonPoints(radius)}
          fill='none'
          stroke={theme.colors.outline}
          strokeWidth='1'
          opacity={opacity}
        />
      );
    });
  };

  // 중심에서 각 축으로의 선 생성
  const renderAxisLines = () => {
    return skills.map((_, index) => {
      const angle = (index * 2 * Math.PI) / skills.length - Math.PI / 2;
      const endX = centerX + maxRadius * Math.cos(angle);
      const endY = centerY + maxRadius * Math.sin(angle);

      return (
        <Line
          key={index}
          x1={centerX}
          y1={centerY}
          x2={endX}
          y2={endY}
          stroke={theme.colors.outline}
          strokeWidth='1'
          opacity={0.3}
        />
      );
    });
  };

  // 스킬 레이블 렌더링
  const renderSkillLabels = () => {
    return skills.map((skill, index) => {
      const angle = (index * 2 * Math.PI) / skills.length - Math.PI / 2;
      const labelRadius = maxRadius + 20;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);

      // 텍스트 앵커 조정
      let textAnchor: 'start' | 'middle' | 'end' = 'middle';
      if (x > centerX + 10) textAnchor = 'start';
      else if (x < centerX - 10) textAnchor = 'end';

      return (
        <G key={index}>
          <SvgText
            x={x}
            y={y}
            fontSize='12'
            fill={theme.colors.onSurface}
            textAnchor={textAnchor}
            fontWeight='bold'
          >
            {skill.name}
          </SvgText>
          <SvgText
            x={x}
            y={y + 15}
            fontSize='10'
            fill={theme.colors.primary}
            textAnchor={textAnchor}
            fontWeight='bold'
          >
            {skill.current}
          </SvgText>
        </G>
      );
    });
  };

  // 현재 스킬 레벨 다각형 생성
  const renderCurrentSkillPolygon = () => {
    const points = skills
      .map((skill, index) => {
        const angle = (index * 2 * Math.PI) / skills.length - Math.PI / 2;
        const radius = (skill.current / 100) * maxRadius;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <G>
        <Polygon
          points={points}
          fill={`${theme.colors.primary}40`} // 40% 투명도
          stroke={theme.colors.primary}
          strokeWidth='2'
        />
        {/* 각 꼭짓점에 원 표시 */}
        {skills.map((skill, index) => {
          const angle = (index * 2 * Math.PI) / skills.length - Math.PI / 2;
          const radius = (skill.current / 100) * maxRadius;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r='4'
              fill={theme.colors.primary}
              stroke='white'
              strokeWidth='2'
            />
          );
        })}
      </G>
    );
  };

  // 목표 스킬 레벨 다각형 생성
  const renderTargetSkillPolygon = () => {
    if (!showTarget) return null;

    const points = skills
      .map((skill, index) => {
        const angle = (index * 2 * Math.PI) / skills.length - Math.PI / 2;
        const radius = (skill.target / 100) * maxRadius;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <Polygon
        points={points}
        fill='none'
        stroke={theme.colors.secondary}
        strokeWidth='2'
        strokeDasharray='5,5'
        opacity={0.8}
      />
    );
  };

  // 중심점 표시
  const renderCenterPoint = () => (
    <Circle cx={centerX} cy={centerY} r='3' fill={theme.colors.outline} />
  );

  // 레벨 표시 (숫자)
  const renderLevelLabels = () => {
    const levels = [20, 40, 60, 80, 100];

    return levels.map(level => {
      const radius = (level / 100) * maxRadius;
      const x = centerX + radius;
      const y = centerY - 5;

      return (
        <SvgText
          key={level}
          x={x}
          y={y}
          fontSize='10'
          fill={theme.colors.outline}
          textAnchor='middle'
        >
          {level}
        </SvgText>
      );
    });
  };

  const calculateAverageScore = (type: 'current' | 'target') => {
    const sum = skills.reduce((acc, skill) => acc + skill[type], 0);
    return Math.round((sum / skills.length) * 10) / 10;
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>{title}</Title>
          <View style={styles.averageScores}>
            <View style={styles.scoreItem}>
              <Paragraph style={[styles.scoreLabel, { color: theme.colors.primary }]}>
                현재 평균
              </Paragraph>
              <Title style={[styles.scoreValue, { color: theme.colors.primary }]}>
                {calculateAverageScore('current')}
              </Title>
            </View>
            {showTarget && (
              <View style={styles.scoreItem}>
                <Paragraph style={[styles.scoreLabel, { color: theme.colors.secondary }]}>
                  목표 평균
                </Paragraph>
                <Title style={[styles.scoreValue, { color: theme.colors.secondary }]}>
                  {calculateAverageScore('target')}
                </Title>
              </View>
            )}
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Svg width={chartSize} height={chartSize}>
            <Defs>
              <RadialGradient id='skillGradient' cx='50%' cy='50%' r='50%'>
                <Stop offset='0%' stopColor={theme.colors.primary} stopOpacity='0.1' />
                <Stop offset='100%' stopColor={theme.colors.primary} stopOpacity='0.3' />
              </RadialGradient>
            </Defs>

            {/* 가이드 라인들 */}
            {renderGuideLines()}

            {/* 축 라인들 */}
            {renderAxisLines()}

            {/* 레벨 숫자 */}
            {renderLevelLabels()}

            {/* 목표 스킬 다각형 (뒤에) */}
            {renderTargetSkillPolygon()}

            {/* 현재 스킬 다각형 (앞에) */}
            {renderCurrentSkillPolygon()}

            {/* 중심점 */}
            {renderCenterPoint()}

            {/* 스킬 레이블들 */}
            {renderSkillLabels()}
          </Svg>
        </View>

        {/* 범례 */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
            <Paragraph style={styles.legendText}>현재 레벨</Paragraph>
          </View>
          {showTarget && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDashed, { borderColor: theme.colors.secondary }]} />
              <Paragraph style={styles.legendText}>목표 레벨</Paragraph>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  averageScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendDashed: {
    width: 16,
    height: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
