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
import {StyleSheet} from 'nativewind';

interface Person {
  name: string;
  items: number[];
}

const cardStyle = StyleSheet.create({
  borderRadius: 10,
  elevation: 3,
  backgroundColor: '#fff',
  shadowOffset: {width: 1, height: 1},
  shadowColor: '#333',
  shadowOpacity: 0.3,
  shadowRadius: 2,
  marginHorizontal: 10,
  marginVertical: 6,
  padding: 8,
});

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
      setAddName('');
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
    <View className="light w-screen text-center flex flex-col items-center justify-center ">
      <ScrollView className="p-8 w-screen">
        <Text className="text-center font-mono text-4xl mt-4">
          Bill Splitter
        </Text>
        <View className="flex flex-row mx-auto">
          <TextInput
            placeholder="Name"
            onChangeText={text => setAddName(text)}
            value={addName}
            onSubmitEditing={() => handleAddName(addName)}
            className="border-2 border-gray-300 rounded-2xl p-2 w-2/3"
          />
          <Button
            className="ml-2 rounded-2xl"
            onPress={() => handleAddName(addName)}
            title="Add Person"
          />
        </View>
        <View className="flex flex-row flex-wrap gap-2 my-4 mb-8">
          {person.map((p, i) => (
            <View key={i} className="p-8 border-2">
              <View className="flex flex-row justify-between">
                <Text className="text-xl font-bold my-auto mr-2">{p.name}</Text>
                <Button
                  onPress={() =>
                    setPerson(prevPersons =>
                      prevPersons.filter((_, index) => index !== i),
                    )
                  }
                  title="x"
                  className="text-4xl self-start text-red-500"
                />
              </View>
              <View>
                {p.items.map((item, index) => (
                  <View key={index} className="flex flex-row justify-between">
                    <Text className="text-sm font-semibold text-green-600 pt-1 mr-2 text-left">{`+ $${item}`}</Text>
                    <RNButton
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
          ))}
        </View>
        {person.length > 0 && (
          <View className="items-center">
            <Card mode="elevated" style={{backgroundColor: '#FFFFFF'}}>
              <Card.Content>
                <View className="flex flex-col">
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
                  <View className="flex flex-row mx-auto gap-2">
                    <TextInput
                      placeholder="Price"
                      onChangeText={text => setPrice(text)}
                      className="w-2/3 border-2 border-gray-300 rounded-2xl p-2"
                      value={price}
                    />
                    <Button
                      onTouchStart={() => handleAddPrice()}
                      title="Add Price"
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
        <View className="w-full items-center p-4">
          <Card
            mode="elevated"
            style={{backgroundColor: '#FFFFFF'}}
            className="w-full">
            <Card.Content>
              <View className="flex flex-row my-1">
                <TextInput
                  placeholder="Tips/Fees"
                  className="w-2/5  mx-2 ml-auto rounded-2xl border-2 border-gray-300 rounded-2xl p-2"
                  onChangeText={text => setFeesTips(parseFloat(text) || 0)}
                />
                <TextInput
                  placeholder="Tax %"
                  className="w-2/5 mx-2 mr-auto rounded-2xl border-2 border-gray-300 rounded-2xl p-2"
                  onChangeText={text => setTax(parseFloat(text) || 0)}
                />
              </View>

              <View className="flex flex-row flex-wrap w-full justify-center mt-8">
                {person.map((p, i) => (
                  <View key={i} className="">
                    <Card mode="elevated" style={{backgroundColor: '#FFFFFF'}}>
                      <Card.Content>
                        <Text>{p.name}</Text>
                        <Text>
                          $
                          {(
                            p.items.reduce((total, item) => total + item, 0) *
                              (1 + tax / 100) +
                            feesTipes / person.length
                          ).toFixed(2)}
                        </Text>
                      </Card.Content>
                    </Card>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        </View>
        <Text>
          Made by Anish Sahoo, Zaydaan Jahangir, William Riser, Rohan Parikh
        </Text>

        <View style={cardStyle}>
          <Text>Hello</Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default App;
