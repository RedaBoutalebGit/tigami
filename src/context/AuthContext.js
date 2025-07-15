import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          await getUserProfile(currentUser.id);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await getUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async (userId) => {
    try {
      // Simple direct query first
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        // Profile doesn't exist, create it
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              full_name: user?.user_metadata?.full_name || 'User',
              role: 'player'
            }
          ])
          .select()
          .single();
        
        if (!insertError) {
          setUserProfile(insertData);
        } else {
          // If insert fails, set a default profile
          setUserProfile({
            id: userId,
            full_name: user?.user_metadata?.full_name || 'User',
            role: 'player'
          });
        }
        return;
      }
      
      // Ensure role exists
      if (!data.role) {
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'player' })
          .eq('id', userId)
          .select()
          .single();
        
        if (!updateError) {
          setUserProfile(updateData);
        } else {
          setUserProfile({ ...data, role: 'player' });
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Set a default profile to prevent crashes
      setUserProfile({
        id: userId,
        full_name: user?.user_metadata?.full_name || 'User',
        role: 'player'
      });
    }
  };

  const signUp = async (email, password, fullName, role = 'player') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Create profile with role
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              role: role,
            },
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      setUserProfile(data);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('Attempting login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Login error:', error);
        throw error;
      }
      console.log('Login successful:', data);
      return { data, error: null };
    } catch (error) {
      console.log('Login failed:', error.message);
      return { data: null, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.clear();
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserRole = () => {
    return userProfile?.role || 'player';
  };

  const isAdmin = () => {
    return userProfile?.role === 'admin';
  };

  const isStadiumOwner = () => {
    return userProfile?.role === 'stadium_owner';
  };

  const isPlayer = () => {
    return userProfile?.role === 'player';
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateUserRole,
    getUserRole,
    isAdmin,
    isStadiumOwner,
    isPlayer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};