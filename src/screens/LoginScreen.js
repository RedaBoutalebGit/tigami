import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, fullName);
      }

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        if (isLogin) {
          // Let the RoleBasedNavigator handle routing based on user role
          navigation.navigate('Main');
        } else {
          Alert.alert(
            'Success', 
            'Account created! Please select your role.',
            [{
              text: 'Continue',
              onPress: () => navigation.navigate('RoleSelection')
            }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.darkGreen]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="football" size={60} color={Colors.accent} />
              <Text style={styles.logoText}>Football Booking</Text>
              <Text style={styles.logoSubtext}>Your pitch awaits</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={Colors.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={Colors.gray}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.gray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={Colors.gray}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.authButton}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isLogin ? 'Login' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              {isLogin && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.footballIcons}>
            <Ionicons name="football-outline" size={20} color={Colors.white} style={styles.footballIcon1} />
            <Ionicons name="football-outline" size={16} color={Colors.white} style={styles.footballIcon2} />
            <Ionicons name="football-outline" size={18} color={Colors.white} style={styles.footballIcon3} />
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: Fonts.sizes.xxxl,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 16,
  },
  logoSubtext: {
    fontSize: Fonts.sizes.md,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  formContainer: {
    flex: 2,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.gray,
  },
  activeTabText: {
    color: Colors.white,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: Fonts.sizes.md,
    color: Colors.secondary,
  },
  authButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  authButtonText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  footballIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    pointerEvents: 'none',
  },
  footballIcon1: {
    position: 'absolute',
    top: 80,
    left: 20,
    transform: [{ rotate: '15deg' }],
  },
  footballIcon2: {
    position: 'absolute',
    top: 120,
    right: 30,
    transform: [{ rotate: '-30deg' }],
  },
  footballIcon3: {
    position: 'absolute',
    bottom: 200,
    left: 40,
    transform: [{ rotate: '45deg' }],
  },
});