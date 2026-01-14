/**
 * 🔒 Admin Dashboard Screen
 * 관리자 전용 대시보드 - 최고 등급 인가
 */

import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Card, Title, List, useTheme, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const AdminDashboardScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title='🔒 관리자 대시보드' />
      </Appbar.Header>

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title>최고 등급 인가</Title>
            <List.Subheader>Lightning Tennis - Admin Control Panel</List.Subheader>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <List.Section>
            <List.Subheader>관리 메뉴</List.Subheader>

            <List.Item
              title='사용자 피드백'
              description='프로젝트 센티넬 - 사용자 이슈 리포트'
              left={props => <List.Icon {...props} icon='alert-circle' color='#f44336' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('UserFeedback' as never)}
            />

            <List.Item
              title='사용자 통계'
              description='총 사용자, 활성 사용자, 신규 가입'
              left={props => <List.Icon {...props} icon='chart-bar' color='#2196f3' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('UserStats' as never)}
            />

            <List.Item
              title='콘텐츠 관리'
              description='이벤트, 클럽, 게시물 관리'
              left={props => <List.Icon {...props} icon='file-document-edit' color='#4caf50' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('ContentManagement' as never)}
            />

            <List.Item
              title='시스템 로그'
              description='서버 로그, 에러 추적, 성능 모니터링'
              left={props => <List.Icon {...props} icon='file-code' color='#ff9800' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={() => navigation.navigate('SystemLog' as never)}
            />
          </List.Section>
        </Card>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
});

export default AdminDashboardScreen;
