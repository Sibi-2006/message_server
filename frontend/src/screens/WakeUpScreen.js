import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');

/**
 * WakeUpScreen
 * Shown while the server cold-start ping is running.
 *
 * Animation: Three chat bubbles appear one-after-another (typing-indicator
 * style), then the app logo fades + scales in, then the bubbles loop
 * while status text updates below.
 */
export default function WakeUpScreen({ statusText }) {
  // ─── Bubble animations (3 dots that pulse in sequence) ────────────────
  const bubble1Scale = useRef(new Animated.Value(0)).current;
  const bubble2Scale = useRef(new Animated.Value(0)).current;
  const bubble3Scale = useRef(new Animated.Value(0)).current;

  const bubble1Opacity = useRef(new Animated.Value(0)).current;
  const bubble2Opacity = useRef(new Animated.Value(0)).current;
  const bubble3Opacity = useRef(new Animated.Value(0)).current;

  // ─── Logo fade + glow pulse ───────────────────────────────────────────
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // ─── Status text fade ─────────────────────────────────────────────────
  const statusOpacity = useRef(new Animated.Value(0)).current;

  const [animationPhase, setAnimationPhase] = useState('bubbles'); // 'bubbles' | 'logo'

  // Helper: pop a single bubble in then out
  const popBubble = (scaleAnim, opacityAnim, delay) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]);

  const hideBubble = (scaleAnim, opacityAnim, delay) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]);

  // Continuously loop the typing-indicator bubble wave
  const loopBubbles = () => {
    bubble1Scale.setValue(0);
    bubble2Scale.setValue(0);
    bubble3Scale.setValue(0);
    bubble1Opacity.setValue(0);
    bubble2Opacity.setValue(0);
    bubble3Opacity.setValue(0);

    Animated.sequence([
      // Pop in one by one
      popBubble(bubble1Scale, bubble1Opacity, 0),
      popBubble(bubble2Scale, bubble2Opacity, 120),
      popBubble(bubble3Scale, bubble3Opacity, 120),
      // Hold a moment
      Animated.delay(500),
      // Fade all out together
      Animated.parallel([
        hideBubble(bubble1Scale, bubble1Opacity, 0),
        hideBubble(bubble2Scale, bubble2Opacity, 60),
        hideBubble(bubble3Scale, bubble3Opacity, 120),
      ]),
      Animated.delay(400),
    ]).start(({ finished }) => {
      if (finished) loopBubbles();
    });
  };

  // Logo entrance + glow pulse loop
  const showLogo = () => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start status text fade
      Animated.timing(statusOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      // Loop glow pulse
      pulseGlow();
    });
  };

  const pulseGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale, {
            toValue: 1.35,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.35,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale, {
            toValue: 0.85,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  };

  useEffect(() => {
    // Phase 1: bubble typing animation while server pings
    loopBubbles();

    // After 1.8 s reveal the logo (server ping continues in background)
    const logoTimer = setTimeout(() => {
      setAnimationPhase('logo');
      showLogo();
    }, 1800);

    return () => clearTimeout(logoTimer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Subtle radial background glow */}
      <View style={styles.backgroundGlow} />

      {/* ── Phase: Chat bubble typing indicator ── */}
      {animationPhase === 'bubbles' && (
        <View style={styles.bubblesWrapper}>
          <View style={styles.bubbleRow}>
            {[
              { scale: bubble1Scale, opacity: bubble1Opacity },
              { scale: bubble2Scale, opacity: bubble2Opacity },
              { scale: bubble3Scale, opacity: bubble3Opacity },
            ].map(({ scale, opacity }, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { transform: [{ scale }], opacity },
                  i === 1 && styles.dotMiddle,
                ]}
              />
            ))}
          </View>
          {/* Bubble tail */}
          <View style={styles.bubbleTail} />
        </View>
      )}

      {/* ── Phase: Logo + glow pulse ── */}
      {animationPhase === 'logo' && (
        <View style={styles.logoContainer}>
          {/* Glow ring behind logo */}
          <Animated.View
            style={[
              styles.glowRing,
              { transform: [{ scale: glowScale }], opacity: glowOpacity },
            ]}
          />
          {/* App icon */}
          <Animated.View
            style={[
              styles.logoWrapper,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
          >
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      )}

      {/* App name */}
      <Animated.Text style={[styles.appName, { opacity: logoOpacity }]}>
        Messenger
      </Animated.Text>

      {/* Status text */}
      <Animated.Text style={[styles.statusText, { opacity: statusOpacity }]}>
        {statusText || 'Connecting…'}
      </Animated.Text>

      {/* Looping dots indicator below status (always visible) */}
      <View style={styles.loaderDots}>
        {[0, 1, 2].map((i) => (
          <_BounceDot key={i} delay={i * 200} />
        ))}
      </View>
    </View>
  );
}

/** Small bouncing dot for the bottom loader */
function _BounceDot({ delay }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: -8,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.delay(600 - delay),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[styles.loaderDot, { transform: [{ translateY: anim }] }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#1a1040',
    opacity: 0.6,
  },

  // ── Chat bubbles ──
  bubblesWrapper: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    borderBottomLeftRadius: 4,
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#818CF8',
  },
  dotMiddle: {
    backgroundColor: '#A5B4FC',
  },
  bubbleTail: {
    width: 12,
    height: 10,
    backgroundColor: '#1E1B4B',
    borderBottomRightRadius: 8,
    marginLeft: 10,
    marginTop: -2,
    // CSS trick: triangle effect via border
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderRightWidth: 12,
    borderRightColor: '#1E1B4B',
  },

  // ── Logo ──
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: 140,
    height: 140,
  },
  glowRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4338CA',
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },

  // ── Text ──
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E0E7FF',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 40,
  },

  // ── Bottom bounce dots ──
  loaderDots: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 60,
  },
  loaderDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4338CA',
    opacity: 0.8,
  },
});
