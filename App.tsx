/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import './global.css';

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

const darkCardStyle = StyleSheet.create({
  borderRadius: 10,
  elevation: 3,
  backgroundColor: '#404040',
  shadowOffset: {width: 1, height: 1},
  shadowColor: '#333',
  shadowOpacity: 0.3,
  shadowRadius: 2,
  marginHorizontal: 10,
  marginVertical: 6,
  padding: 8,
});

const smallCardStyle = StyleSheet.create({
  borderRadius: 10,
  elevation: 3,
  backgroundColor: '#fff',
  shadowOffset: {width: 1, height: 1},
  shadowColor: '#333',
  shadowOpacity: 0.3,
  shadowRadius: 2,
  marginHorizontal: 6,
  marginVertical: 6,
  paddingHorizontal: 8,
  paddingVertical: 4,
});

function App(): React.JSX.Element {
  const [person, setPerson] = useState<Person[]>([]); // list of user objects
  const [addName, setAddName] = useState<string>(''); // name of the user to be added
  const [selectedPerson, setSelectedPerson] = useState<number>(-1); // index of the selected person
  const [price, setPrice] = useState<string>(''); // price of the item
  const [setOfUsers, setSetOfUsers] = useState<Set<string>>(new Set<string>()); // set of user names
  const [feesTipes, setFeesTips] = useState<number>(0); // fees and tips
  const [tax, setTax] = useState<number>(0); // tax

  const colorScheme = useColorScheme();

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
    <View className="light w-screen text-center flex flex-col items-center justify-center min-h-screen dark:bg-neutral-800">
      <ScrollView className="p-8 w-screen">
        <Text className="text-center font-mono text-4xl mb-8 dark:text-white">
          Bill Splitter
        </Text>
        <View className={`flex flex-row mx-auto ${person.length <= 0 ? 'justify-center' : ''}`}>
          <TextInput
            placeholder="Name"
            onChangeText={text => setAddName(text)}
            value={addName}
            onSubmitEditing={() => handleAddName(addName)}
            className="rounded-2xl p-2 px-4 w-2/3 bg-zinc-100 dark:bg-zinc-600 dark:text-white"
          />
          <TouchableOpacity
            activeOpacity={0.6}
            className="ml-2 my-auto"
            onPress={() => handleAddName(addName)}
          >
            <Text className="bg-zinc-300 text-black py-2 px-4 rounded-2xl text-xl text-wrap">
              Add
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex flex-row flex-wrap my-4 mb-8 mx-auto justify-center items-center">
          {person.map((p, i) => (
            <View key={i} style={smallCardStyle}>
              <View className="p-2">
                <View className="flex flex-row justify-between">
                  <Text className="text-xl font-bold my-auto mr-2 text-black">
                    {p.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      {setPerson(prevPersons =>
                        prevPersons.filter((_, index) => index !== i),
                      )
                      setSetOfUsers(prevSet => {
                        const newSet = new Set(prevSet);
                        newSet.delete(p.name.toLowerCase());
                        return newSet;
                      })
                    }}
                    className="self-start">
                    <Text className="text-red-500 text-3xl">x</Text>
                  </TouchableOpacity>
                </View>
                <View>
                  {p.items.map((item, index) => (
                    <View key={index} className="flex flex-row justify-between">
                      <Text className="text-sm font-semibold text-green-600 pt-1 mr-2 text-left">{`+ $${item}`}</Text>
                      <TouchableOpacity
                        className="self-start"
                        onPress={() => {
                          const newPerson = [...person];
                          newPerson[i].items = newPerson[i].items.filter(
                            (_, j) => j !== index,
                          );
                          setPerson(newPerson);
                        }}>
                        <Text className="text-black dark:text-white text-lg">
                          x
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
        {person.length > 0 && (
          <View className="items-center" style={colorScheme == 'light'? cardStyle : darkCardStyle}>
            <View className="flex flex-col w-full p-4">
              <View className="bg-zinc-100 dark:bg-zinc-600 rounded-2xl">
                <Picker
                  placeholder='Select a Person'
                  selectedValue={selectedPerson}
                  onValueChange={(itemValue, itemIndex) =>
                    setSelectedPerson(itemValue)
                  }>
                  <Picker.Item label="Select a Person" value={-1} className="text-gray-800" />
                  {person.map((p, index) => (
                    <Picker.Item key={index} label={p.name} value={index} />
                  ))}
                </Picker>
              </View>
              <View className={`flex flex-row w-full mt-2 ${selectedPerson === -1 ? 'hidden' : ''}`}>
                <TextInput
                  placeholder=" Price"
                  onChangeText={text => setPrice(text)}
                  className="flex-grow bg-zinc-100 dark:bg-zinc-600 rounded-xl px-4 py-2 justify-start"
                  value={price}
                />
                <View className="">
                <TouchableOpacity
                className="my-auto ml-2"
                  activeOpacity={0.6}
                  onPress={() => handleAddPrice()}>
                  <Text className="text-center bg-zinc-300 text-black rounded-2xl text-lg p-2">
                    Add Price
                  </Text>
                </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
        <View className={`items-center p-4 ${person.length > 0 ? '' : 'hidden'}`} style={colorScheme == 'light'? cardStyle : darkCardStyle}>
          <View className="flex flex-col my-1 w-full">
            <TextInput
              placeholder=" Tips/Fees"
              className="w-3/5 mx-auto my-1 bg-zinc-100 dark:bg-zinc-600 rounded-2xl px-4 py-2"
              onChangeText={text => setFeesTips(parseFloat(text) || 0)}
            />
            <TextInput
              placeholder=" Tax %"
              className="w-3/5 mx-auto my-1 bg-zinc-100 dark:bg-zinc-600 rounded-2xl px-4 py-2"
              onChangeText={text => setTax(parseFloat(text) || 0)}
            />
          </View>

          <View className="flex flex-row flex-wrap w-full justify-center mt-4">
            {person.map((p, i) => (
              <View key={i} className="" style={cardStyle}>
                <Text className="text-black">{p.name}</Text>
                <Text className="text-black">
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
        <View className="h-16">

        </View>
      </ScrollView>
    </View>
  );
}

export default App;
