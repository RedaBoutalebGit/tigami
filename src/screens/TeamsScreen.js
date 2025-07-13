import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const TeamCard = ({ team, onPress, onManage, isCaptain }) => (
  <TouchableOpacity style={styles.teamCard} onPress={onPress}>
    <View style={styles.teamHeader}>
      <View style={styles.teamIcon}>
        <Ionicons name="people" size={30} color={Colors.primary} />
      </View>
      <View style={styles.teamInfo}>
        <Text style={styles.teamName}>{team.name}</Text>
        <Text style={styles.teamDescription}>{team.description || 'No description'}</Text>
        <View style={styles.teamMeta}>
          <Text style={styles.memberCount}>{team.member_count || 0} members</Text>
          {isCaptain && (
            <View style={styles.captainBadge}>
              <Ionicons name="star" size={12} color={Colors.accent} />
              <Text style={styles.captainText}>Captain</Text>
            </View>
          )}
        </View>
      </View>
    </View>
    {isCaptain && (
      <TouchableOpacity style={styles.manageButton} onPress={onManage}>
        <Ionicons name="settings-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

const CreateTeamModal = ({ visible, onClose, onCreateTeam, loading }) => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }
    onCreateTeam(teamName, description);
    setTeamName('');
    setDescription('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Team</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Team Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter team name"
              value={teamName}
              onChangeText={setTeamName}
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Tell us about your team"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.createButtonText}>Create Team</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function TeamsScreen({ navigation }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch teams where user is captain
      const { data: captainTeams, error: captainError } = await supabase
        .from('teams')
        .select('*, team_members!inner(user_id)')
        .eq('captain_id', user.id);

      if (captainError) throw captainError;

      // Fetch teams where user is a member
      const { data: memberTeams, error: memberError } = await supabase
        .from('teams')
        .select('*, team_members!inner(user_id)')
        .eq('team_members.user_id', user.id)
        .neq('captain_id', user.id);

      if (memberError) throw memberError;

      // Count members for each team
      const allTeams = [...(captainTeams || []), ...(memberTeams || [])];
      const teamsWithCounts = await Promise.all(
        allTeams.map(async (team) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact' })
            .eq('team_id', team.id);
          
          return {
            ...team,
            member_count: count,
            isCaptain: team.captain_id === user.id,
          };
        })
      );

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error fetching teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (name, description) => {
    try {
      setCreateLoading(true);

      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            captain_id: user.id,
            name,
            description,
          }
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      // Add the captain as a team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([
          {
            team_id: team.id,
            user_id: user.id,
            role: 'captain',
          }
        ]);

      if (memberError) throw memberError;

      Alert.alert('Success', 'Team created successfully!');
      setCreateModalVisible(false);
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert('Error', 'Failed to create team');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTeamPress = (team) => {
    navigation.navigate('TeamDetails', { team });
  };

  const handleManageTeam = (team) => {
    navigation.navigate('ManageTeam', { team });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading teams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Teams</Text>
        <Text style={styles.headerSubtitle}>Manage your football squads</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.createTeamButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color={Colors.white} />
            <Text style={styles.createTeamButtonText}>Create New Team</Text>
          </TouchableOpacity>
        </View>

        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={80} color={Colors.gray} />
            <Text style={styles.emptyStateTitle}>No Teams Yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first team or ask a friend to invite you to theirs
            </Text>
          </View>
        ) : (
          <View style={styles.teamsSection}>
            <Text style={styles.sectionTitle}>Your Teams ({teams.length})</Text>
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onPress={() => handleTeamPress(team)}
                onManage={() => handleManageTeam(team)}
                isCaptain={team.isCaptain}
              />
            ))}
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Team Features</Text>
              <Text style={styles.infoText}>
                • Create teams with up to 14 players{'\n'}
                • Invite friends via email or phone{'\n'}
                • Book stadiums as a team{'\n'}
                • Track team statistics and history
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <CreateTeamModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreateTeam={handleCreateTeam}
        loading={createLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Fonts.sizes.md,
    color: Colors.gray,
    marginTop: 12,
  },
  actionSection: {
    padding: 20,
  },
  createTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createTeamButtonText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: Fonts.sizes.md,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  teamsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 16,
  },
  teamCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamIcon: {
    width: 50,
    height: 50,
    backgroundColor: Colors.lightGray,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginBottom: 8,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
    marginRight: 12,
  },
  captainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  captainText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.secondary,
    marginLeft: 2,
    fontWeight: '500',
  },
  manageButton: {
    padding: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    padding: 16,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    color: Colors.secondary,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: Fonts.sizes.md,
    color: Colors.secondary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.white,
  },
});