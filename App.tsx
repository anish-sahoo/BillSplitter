/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import {Button, Text, TextInput, View, ScrollView} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import './global.css';
import {Card} from 'react-native-paper';

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
    if (name === '') {
      return;
    }
    if (setOfUsers.has(name.toLowerCase())) {
      return;
    }
    setPerson([...person, {name, items: []}]);
    setSetOfUsers(prevSet => new Set(prevSet.add(name.toLowerCase())));
    setAddName('');
  };

  const handleAddPrice = () => {
    if (price === '') {
      return;
    }
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
    <View className="w-screen text-center flex flex-col items-center justify-center bg-white">
      <ScrollView className="px-8 ">
        <Text className="text-center font-mono text-4xl mt-4">
          Bill Splitter
        </Text>
        <View className="flex flex-row mx-auto">
          <TextInput
            placeholder="Name"
            onChangeText={text => setAddName(text)}
            value={addName}
            onSubmitEditing={() => handleAddName(addName)}
            className="border-2 border-gray-300 rounded-md p-2 w-2/3"
          />
          <Button
            className="ml-2 rounded-md"
            title="Add Person"
            onPress={() => handleAddName(addName)}
          />
        </View>
        <View className="flex flex-row flex-wrap gap-2 my-4 mb-8">
          {person.map((p, i) => (
            <View key={i} className="p-8 rounded-8 shadow-sm">
              <View>
                <View className="flex flex-row justify-between">
                  <Text className="text-xl font-bold my-auto mr-2">
                    {p.name}
                  </Text>
                  <Button
                    title="X"
                    className="text-sm self-start text-red-500"
                    onPress={() =>
                      setPerson(prevPersons =>
                        prevPersons.filter((_, index) => index !== i),
                      )
                    }
                  />
                </View>
                <View>
                  {p.items.map((item, index) => (
                    <View key={index} className="flex flex-row justify-between">
                      <Text className="text-sm font-semibold text-green-600 pt-1 mr-2 text-left">{`+ $${item}`}</Text>
                      <Button
                        title="x"
                        className="self-start"
                        onPress={() => {
                          const newPerson = [...person];
                          newPerson[i].items = newPerson[i].items.filter(
                            (_, j) => j !== index,
                          );
                          setPerson(newPerson);
                        }}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
        {person.length > 0 && (
          <View className="w-full items-center border-gray-400 border-2">
            <View className="flex md:flex-row flex-col border-gray-400 border-2">
              <Picker
                selectedValue={selectedPerson}
                onValueChange={(itemValue, itemIndex) =>
                  setSelectedPerson(itemValue)
                }>
                <Picker.Item label="Select a Person" value={-1} />
                {person.map((p, index) => (
                  <Picker.Item key={index} label={p.name} value={index} />
                ))}
              </Picker>
              <View className="flex flex-row mx-auto border-2 gap-2 border-gray-300">
                <TextInput
                  placeholder="Price"
                  onChangeText={text => setPrice(text)}
                  className="w-2/3 border-2 border-gray-200"
                  value={price}
                />
                <Button title="Add Price" onPress={handleAddPrice} />
              </View>
            </View>
          </View>
        )}
        <View className="w-full items-center border-2 border-gray-200">
          <View className="flex flex-row my-1 sm:my-0 sm:mb-4 gap-2 p-8">
            <TextInput
              placeholder="Tips/Fees"
              className="w-1/2 border-2 border-gray-200"
              onChangeText={text => setFeesTips(parseFloat(text) || 0)}
            />
            <TextInput
              placeholder="Tax %"
              className="w-1/2 border-2 border-gray-200"
              onChangeText={text => setTax(parseFloat(text) || 0)}
            />
          </View>
          <View className="flex flex-row flex-wrap w-full gap-4 justify-center">
            {person.map((p, i) => (
              <View key={i} className="border-2 border-gray-600 p-4">
                <Text>{p.name}</Text>
                <Text>
                  $
                  {(
                    p.items.reduce((total, item) => total + item, 0) *
                      (1 + tax / 100) +
                    feesTipes / person.length
                  ).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Text>
          Made by Anish Sahoo, Zaydaan Jahangir, William Riser, Rohan Parikh
        </Text>
        <View className="p-8">
          <Card mode="elevated" style={{backgroundColor: '#FFFFFF'}}>
            <Card.Title title="Card Title" subtitle="Card Subtitle" />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

export default App;
