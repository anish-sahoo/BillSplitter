/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// import React from 'react';
// import {Button, Text, View} from 'react-native';
// import './global.css';

// function App(): React.JSX.Element {
//   return (
//     <View className="flex-1 items-center justify-center w-screen bg-indigo-900">
//       <Text className="text-6xl font-caveat text-white">Good Evening! </Text>
//       <Button title="Click me" />
//     </View>
//   );
// }

// export default App;

// App.tsx

import React, { useState } from 'react';
import { Button, Text, TextInput, View, ScrollView } from 'react-native';
import {Picker} from '@react-native-picker/picker';

interface Person {
  name: string;
  items: number[];
}

function App(): React.JSX.Element {
  const [person, setPerson] = useState<Person[]>([]);
  const [addName, setAddName] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<number>(-1);
  const [price, setPrice] = useState<string>('');
  const [setOfUsers, setSetOfUsers] = useState<Set<string>>(new Set<string>());
  const [feesTipes, setFeesTips] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  const handleAddName = (name: string) => {
    if (name === '') return;
    if (setOfUsers.has(name.toLowerCase())) return;
    setPerson([...person, { name, items: [] }]);
    setSetOfUsers((prevSet) => new Set(prevSet.add(name.toLowerCase())));
    setAddName('');
  };

  const handleAddPrice = () => {
    if (price === '') return;
    if (isNaN(parseFloat(price))) {
      setPrice('');
      return;
    }
    const newPerson = [...person];
    newPerson[selectedPerson].items.push(parseFloat(price));
    setPerson(newPerson);
    setPrice('');
  };

  return (
    <View>
      <Text>Bill Splitter</Text>
      <ScrollView>
        <View>
          <TextInput
            placeholder="Name"
            onChangeText={(text) => setAddName(text)}
            value={addName}
            onSubmitEditing={() => handleAddName(addName)}
          />
          <Button title="Add Person" onPress={() => handleAddName(addName)} />
        </View>
        <View>
          {person.map((p, i) => (
            <View key={i}>
              <View>
                <Text>{p.name}</Text>
                <Button
                  title="X"
                  onPress={() => setPerson((prevPersons) => prevPersons.filter((_, index) => index !== i))}
                />
              </View>
              <View>
                {p.items.map((item, index) => (
                  <View key={index}>
                    <Text>{`+ $${item}`}</Text>
                    <Button
                      title="x"
                      onPress={() => {
                        const newPerson = [...person];
                        newPerson[i].items = newPerson[i].items.filter((_, j) => j !== index);
                        setPerson(newPerson);
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        {person.length > 0 && (
          <View>
            <Picker
              selectedValue={selectedPerson}
              onValueChange={(itemValue, itemIndex) => setSelectedPerson(itemValue)}
            >
              <Picker.Item label="Select a Person" value={-1} />
              {person.map((p, index) => (
                <Picker.Item key={index} label={p.name} value={index} />
              ))}
            </Picker>
            <TextInput
              placeholder="Price"
              onChangeText={(text) => setPrice(text)}
              value={price}
            />
            <Button title="Add Price" onPress={handleAddPrice} />
          </View>
        )}
        <View>
          <View>
            <TextInput
              placeholder="Tips/Fees"
              onChangeText={(text) => setFeesTips(parseFloat(text) || 0)}
            />
            <TextInput
              placeholder="Tax %"
              onChangeText={(text) => setTax(parseFloat(text) || 0)}
            />
          </View>
          <View>
            {person.map((p, i) => (
              <View key={i}>
                <Text>{p.name}</Text>
                <Text>${((p.items.reduce((total, item) => total + item, 0) * (1 + tax / 100)) + (feesTipes / person.length)).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text>Made by Anish Sahoo, Zaydaan Jahangir, William Riser, Rohan Parikh</Text>
      </ScrollView>
    </View>
  );
}

export default App;
