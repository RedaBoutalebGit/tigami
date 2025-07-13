# Football Booking App 🏈

A modern and user-friendly mobile app for youth football players and enthusiasts to book 7-a-side football stadiums and playgrounds in Morocco.

## 🌟 Features

### Core Features
- **User Onboarding & Authentication** - Smooth registration and login experience
- **Playground Discovery** - Search and filter football stadiums with location-based results
- **Booking System** - Calendar-based booking with real-time availability
- **Team Management** - Create teams, invite players, and manage squads
- **Profile & History** - User profiles with booking history and statistics
- **Stadium Owner Dashboard** - Admin panel for stadium owners to manage bookings and pricing

### Target Audience
- Youth football players and enthusiasts (ages 15-50)
- Primarily male demographic but inclusive design
- Moroccan market focused

## 🎨 Design & Branding

### Color Palette
- **Primary**: Grass Green (`#1a5f1a`)
- **Secondary**: Pitch Black (`#000000`)
- **Background**: Bright White (`#ffffff`)
- **Accent**: Neon Yellow (`#ffff00`) / Neon Red (`#ff0000`)

### Typography
- Bold, sporty, clean sans-serif fonts
- Hierarchical text sizing for optimal readability

### Visual Elements
- Football icons and player silhouettes
- Turf textures and grass patterns
- Urban vibes with smooth gradients
- Loading animations with spinning footballs

## 🛠️ Technology Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development and build toolchain
- **React Navigation** - Navigation between screens
- **React Native Calendars** - Calendar component for bookings
- **Expo Vector Icons** - Icon library
- **React Native Reanimated** - Smooth animations

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database (via Supabase)
- **Row Level Security** - Data security and access control
- **Real-time subscriptions** - Live updates

### State Management
- **React Context** - Authentication and global state
- **AsyncStorage** - Local data persistence

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd football-booking-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Supabase**
- Create a new Supabase project
- Copy your project URL and anon key
- Update `src/services/supabase.js` with your credentials
- Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor

4. **Start the development server**
```bash
npm start
```

5. **Run on device/simulator**
```bash
# iOS
npm run ios

# Android
npm run android
```

## 📱 App Structure

### Screen Flow
```
Onboarding → Login/Register → Main App
                                ↓
Main Tab Navigator:
├── Home (Discover Stadiums)
├── Booking (Calendar & Time Slots)
├── Teams (Team Management)
└── Profile (User Profile & History)
```

### Key Components
- `FootballLoader` - Animated loading spinner
- `GrassPattern` - Background texture component
- `PrimaryButton` - Reusable button with variants
- `StadiumCard` - Stadium display component
- `AnimatedCard` - Card with entrance animations
- `LoadingState` - Loading states for different contexts

## 🗄️ Database Schema

### Core Tables
- **profiles** - User profile information
- **stadiums** - Stadium details and amenities
- **teams** - Football teams
- **team_members** - Team membership
- **bookings** - Stadium bookings
- **reviews** - Stadium reviews and ratings

### Features
- Row Level Security (RLS) policies
- Real-time subscriptions
- Automatic timestamp management
- Comprehensive indexing for performance

## 🎯 Key Features Implementation

### Booking System
- Calendar integration with availability checking
- Real-time slot availability
- Conflict prevention
- Price calculation
- Payment status tracking

### Team Management
- Team creation and invitation system
- Role-based permissions (Captain vs Player)
- Team statistics and history
- Member management

### Stadium Discovery
- Location-based search
- Filter by amenities, price, rating
- Map integration ready
- Photo galleries
- Rating and review system

### User Experience
- Smooth animations and transitions
- Loading states with football themes
- Intuitive navigation
- Responsive design
- Error handling and user feedback

## 🔧 Configuration

### Environment Variables
Create a `.env` file with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Customization
- Colors can be modified in `src/constants/Colors.js`
- Font settings in `src/constants/Fonts.js`
- Animation parameters in component files

## 🚀 Deployment

### Building for Production
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

### Supabase Deployment
- Database schema is production-ready
- RLS policies ensure data security
- API endpoints are automatically generated

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Acknowledgments

- Football community in Morocco
- React Native and Expo teams
- Supabase for the excellent backend service
- All contributors and testers

---

**Built with ❤️ for the football community in Morocco** 🇲🇦