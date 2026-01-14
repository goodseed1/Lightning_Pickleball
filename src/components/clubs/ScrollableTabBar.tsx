import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text as PaperText, Badge } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface Route {
  key: string;
  title: string;
}

interface NavigationState {
  index: number;
  routes: Route[];
}

interface ScrollableTabBarProps {
  navigationState: NavigationState;
  onTabPress: (route: Route) => void;
  activeColor: string;
  inactiveColor: string;
  backgroundColor: string;
  indicatorColor: string;
  // 🦾 IRON MAN: Optional badge counts for tabs (yellow badges - notifications)
  badgeCounts?: Record<string, number>;
  // 🔴 [KIM FIX] Optional red badge counts for tabs (chat unread messages)
  redBadgeCounts?: Record<string, number>;
  // 🎨 Custom colors for specific tabs (e.g., admin tab highlight)
  tabColors?: Record<string, string>;
  // 🎯 Optional icons for specific tabs (Ionicons name)
  tabIcons?: Record<string, keyof typeof Ionicons.glyphMap>;
}

export const ScrollableTabBar: React.FC<ScrollableTabBarProps> = ({
  navigationState,
  onTabPress,
  activeColor,
  inactiveColor,
  backgroundColor,
  indicatorColor,
  badgeCounts,
  redBadgeCounts,
  tabColors,
  tabIcons,
}) => {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation value for pendulum motion
  const translateX = useRef(new Animated.Value(0)).current;

  // Custom pendulum animation - side-to-side movement to indicate scroll direction
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [translateX]);

  // Calculate indicator visibility with buffer to prevent flickering
  const showLeftIndicator = contentWidth > layoutWidth && scrollPosition > 10;
  const showRightIndicator =
    contentWidth > layoutWidth && scrollPosition < contentWidth - layoutWidth - 10;

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  const handleContentSizeChange = (width: number) => {
    setContentWidth(width);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollPosition(event.nativeEvent.contentOffset.x);
  };

  const handleTabPress = (route: Route, index: number) => {
    onTabPress(route);

    // Auto-scroll to center the active tab
    if (scrollViewRef.current && layoutWidth > 0) {
      const tabWidth = contentWidth / navigationState.routes.length;
      const targetX = Math.max(
        0,
        Math.min(index * tabWidth - layoutWidth / 2 + tabWidth / 2, contentWidth - layoutWidth)
      );
      scrollViewRef.current.scrollTo({ x: targetX, animated: true });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Left scroll indicator */}
      {showLeftIndicator && (
        <Animated.View
          style={[
            styles.indicator,
            styles.leftIndicator,
            { transform: [{ translateX: translateX }] },
          ]}
        >
          <Ionicons name='chevron-back' size={20} color={activeColor} />
        </Animated.View>
      )}

      {/* Scrollable tab content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {navigationState.routes.map((route, index) => {
          const isActive = navigationState.index === index;
          const badgeCount = badgeCounts?.[route.key] || 0;
          // 🔴 [KIM FIX] Red badge count for chat unread messages
          const redBadgeCount = redBadgeCounts?.[route.key] || 0;
          // 🎨 Use custom tab color if provided, otherwise use default active/inactive colors
          const customColor = tabColors?.[route.key];
          const tabTextColor = customColor || (isActive ? activeColor : inactiveColor);
          // 🎯 Get icon for this tab if provided
          const tabIcon = tabIcons?.[route.key];
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={() => handleTabPress(route, index)}
            >
              <View style={styles.tabLabelContainer}>
                {/* 🎯 Render icon if provided */}
                {tabIcon && (
                  <Ionicons name={tabIcon} size={14} color={tabTextColor} style={styles.tabIcon} />
                )}
                <PaperText
                  variant='bodyMedium'
                  style={[
                    styles.tabLabel,
                    {
                      color: tabTextColor,
                      fontWeight: isActive || customColor ? '600' : 'normal',
                    },
                  ]}
                >
                  {route.title}
                </PaperText>
                {/* 🔴🟡 [KIM FIX] Stacked badges like bottom tab bar - red on top, yellow below */}
                {(badgeCount > 0 || redBadgeCount > 0) && (
                  <View style={styles.badgeContainer}>
                    {redBadgeCount > 0 && (
                      <Badge size={16} style={styles.redBadge}>
                        {redBadgeCount}
                      </Badge>
                    )}
                    {badgeCount > 0 && (
                      <Badge size={16} style={styles.badge}>
                        {badgeCount}
                      </Badge>
                    )}
                  </View>
                )}
              </View>
              {/* Active tab indicator */}
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: indicatorColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Right scroll indicator */}
      {showRightIndicator && (
        <Animated.View
          style={[
            styles.indicator,
            styles.rightIndicator,
            { transform: [{ translateX: translateX }] },
          ]}
        >
          <Ionicons name='chevron-forward' size={20} color={activeColor} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    textTransform: 'none',
    textAlign: 'center',
  },
  tabIcon: {
    marginRight: 2,
  },
  // 🔴🟡 [KIM FIX] Diagonal stacked badge container - like bottom tab bar
  badgeContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    marginLeft: 4,
  },
  badge: {
    position: 'absolute',
    right: -2,
    top: 0, // 🔧 [KIM FIX] Align with red badge height
    backgroundColor: '#FFC107', // 🎨 Yellow badge for activity notifications
    color: '#000', // Dark text for better contrast on yellow
    fontSize: 10,
    fontWeight: 'bold',
  },
  redBadge: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#f44336', // 🔴 Red badge for chat unread messages
    color: '#fff', // White text for contrast on red
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    borderRadius: 1.5,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  leftIndicator: {
    left: 0,
    backgroundColor: 'transparent',
  },
  rightIndicator: {
    right: 0,
    backgroundColor: 'transparent',
  },
});
