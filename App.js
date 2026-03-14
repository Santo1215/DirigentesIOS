import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserContext } from './context/UserContext';

import Login from './screens/Login';
import Home from './screens/Home';
import CrearDiri from './screens/CrearDiri';
import Diris from './screens/Diris';
import Multas from './screens/Multas';
import Tribu from './screens/Tribu';
import Menu from './screens/Menu';
import Puntos from './screens/Puntos';
import AsistenciaTribus from './screens/AsistenciaTribus';
import AsistenciaDiris from './screens/AsistenciaDiris';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    document.title = "MyDiri";
  }, []);
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
      </Stack.Navigator>
    </NavigationContainer>
    </UserContext.Provider>
  );
}
