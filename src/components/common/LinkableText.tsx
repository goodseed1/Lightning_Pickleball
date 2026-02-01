/**
 * LinkableText Component
 *
 * 텍스트에서 URL을 자동으로 감지하여 클릭 가능한 링크로 변환합니다.
 * 링크를 누르면 기기의 기본 브라우저에서 열립니다.
 *
 * @example
 * <LinkableText style={styles.messageText}>
 *   Check out this link: https://example.com
 * </LinkableText>
 */

import React from 'react';
import { Text, TextStyle, Linking, Alert, StyleProp } from 'react-native';

interface LinkableTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

// URL 정규식 패턴 (http, https, www로 시작하는 링크)
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

const LinkableText: React.FC<LinkableTextProps> = ({
  children,
  style,
  linkStyle,
  numberOfLines,
}) => {
  // 텍스트가 없으면 빈 Text 반환
  if (!children || typeof children !== 'string') {
    return <Text style={style}>{children}</Text>;
  }

  /**
   * URL을 브라우저에서 열기
   */
  const handleLinkPress = async (url: string) => {
    try {
      // www로 시작하면 https:// 추가
      const fullUrl = url.startsWith('www.') ? `https://${url}` : url;

      const canOpen = await Linking.canOpenURL(fullUrl);

      if (canOpen) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      console.error('[LinkableText] Error opening URL:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  /**
   * 텍스트를 URL과 일반 텍스트로 분리하여 렌더링
   */
  const renderTextWithLinks = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // URL_REGEX의 lastIndex를 리셋
    URL_REGEX.lastIndex = 0;

    while ((match = URL_REGEX.exec(children)) !== null) {
      const url = match[0];
      const matchIndex = match.index;

      // URL 이전의 일반 텍스트 추가
      if (matchIndex > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`}>{children.substring(lastIndex, matchIndex)}</Text>
        );
      }

      // URL을 클릭 가능한 링크로 추가
      parts.push(
        <Text
          key={`link-${matchIndex}`}
          style={[{ color: '#2196F3', textDecorationLine: 'underline' }, linkStyle]}
          onPress={() => handleLinkPress(url)}
        >
          {url}
        </Text>
      );

      lastIndex = matchIndex + url.length;
    }

    // 마지막 URL 이후의 일반 텍스트 추가
    if (lastIndex < children.length) {
      parts.push(<Text key={`text-${lastIndex}`}>{children.substring(lastIndex)}</Text>);
    }

    return parts;
  };

  // URL이 없으면 일반 텍스트로 렌더링
  if (!URL_REGEX.test(children)) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {children}
      </Text>
    );
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {renderTextWithLinks()}
    </Text>
  );
};

export default LinkableText;
