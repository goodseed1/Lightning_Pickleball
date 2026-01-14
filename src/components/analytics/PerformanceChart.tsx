import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Card, Title, Paragraph, useTheme } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

interface ChartConfig {
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  color: (opacity?: number) => string;
  strokeWidth: number;
  barPercentage: number;
  useShadowColorFromDataset: boolean;
}

interface ChartData {
  labels?: string[];
  values?: number[];
  datasets?: Array<{
    data: number[];
  }>;
}

interface PerformanceChartProps {
  type: 'skill_progress' | 'win_rate_trend' | 'match_frequency' | 'time_performance';
  data: ChartData;
  title: string;
  subtitle?: string;
}

export default function PerformanceChart({ type, data, title, subtitle }: PerformanceChartProps) {
  const theme = useTheme();

  const chartConfig: ChartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(29, 118, 210, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
  };

  const renderChart = () => {
    switch (type) {
      case 'skill_progress':
        return renderSkillProgressChart();
      case 'win_rate_trend':
        return renderWinRateTrendChart();
      case 'match_frequency':
        return renderMatchFrequencyChart();
      case 'time_performance':
        return renderTimePerformanceChart();
      default:
        return null;
    }
  };

  const renderSkillProgressChart = () => {
    const chartData = {
      labels: data.labels || [],
      datasets: [
        {
          data: data.values || [],
          color: (opacity = 1) => `rgba(29, 118, 210, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={screenWidth - 60}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        decorator={() => {
          return null;
        }}
        onDataPointClick={data => {
          console.log('Data point clicked:', data);
        }}
      />
    );
  };

  const renderWinRateTrendChart = () => {
    const chartData = {
      labels: data.labels || [],
      datasets: [
        {
          data: data.values || [],
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={screenWidth - 60}
        height={220}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        }}
        style={styles.chart}
        fromZero
        segments={4}
      />
    );
  };

  const renderMatchFrequencyChart = () => {
    const chartData = {
      labels: data.labels || [],
      datasets: [
        {
          data: data.values || [],
        },
      ],
    };

    return (
      <BarChart
        data={chartData}
        width={screenWidth - 60}
        height={220}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        }}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
      />
    );
  };

  const renderTimePerformanceChart = () => {
    const pieData = (data as Array<{ name: string; value: number }>).map((item, index) => ({
      name: item.name,
      population: item.value,
      color: getColorForIndex(index),
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    }));

    return (
      <PieChart
        data={pieData}
        width={screenWidth - 60}
        height={220}
        chartConfig={chartConfig}
        accessor='population'
        backgroundColor='transparent'
        paddingLeft='15'
        style={styles.chart}
      />
    );
  };

  const getColorForIndex = (index: number): string => {
    const colors = [
      '#1976D2', // Blue
      '#388E3C', // Green
      '#F57C00', // Orange
      '#7B1FA2', // Purple
      '#C2185B', // Pink
      '#00796B', // Teal
    ];
    return colors[index % colors.length];
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>{title}</Title>
          {subtitle && <Paragraph style={styles.subtitle}>{subtitle}</Paragraph>}
        </View>
        <View style={styles.chartContainer}>{renderChart()}</View>
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
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
});
