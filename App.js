import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserContext } from './context/UserContext';

import Login from './screens/Login';
import * as Notifications from 'expo-notifications';

// expo-notifications no está soportado en web; sin este guard, esta llamada
// podía fallar silenciosamente (o romper la carga) en la versión web.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

import Home from './screens/Home';
import CrearDiri from './screens/CrearDiri';
import Diris from './screens/Diris';
import Multas from './screens/Multas';
import Tribu from './screens/Tribu';
import Menu from './screens/Menu';
import Puntos from './screens/Puntos';
import AsistenciaTribus from './screens/AsistenciaTribus';
import AsistenciaDiris from './screens/AsistenciaDiris';
import AsistenciaMenu from './screens/AsistenciaMenu';
import Calendario from './screens/Calendario';
import Material from './screens/Material';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Diris" component={Diris} />
          <Stack.Screen name="CrearDiri" component={CrearDiri} />
          <Stack.Screen name="Multas" component={Multas} />
          <Stack.Screen name="Tribu" component={Tribu} />
          <Stack.Screen name="Menu" component={Menu} />
          <Stack.Screen name="Puntos" component={Puntos} />
          <Stack.Screen name="AsistenciaTribus" component={AsistenciaTribus} />
          <Stack.Screen name="AsistenciaDiris" component={AsistenciaDiris} />
          <Stack.Screen name="AsistenciaMenu" component={AsistenciaMenu} />
          <Stack.Screen name="Calendario" component={Calendario} />
          <Stack.Screen name="Material" component={Material} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserContext.Provider>
  );
}