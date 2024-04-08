import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, View, Image, TouchableOpacity, Button, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setStorage, getStorage } from './storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Calendar from 'expo-calendar';
import Datetimepicker from '@react-native-community/datetimepicker'
import axios from 'axios'

type dataType = {
  id: string,
  title: string,
  done: boolean,
  image: string,
  latitude: string,
  longitude: string,
  datetime: Date
}

type CheckBoxProps = { label: string, checked: boolean, onPress: any };
const CheckBox = ({ label, checked, onPress }: CheckBoxProps) => {
  return (
    <TouchableOpacity style={styles.checkbox} onPress={onPress}>
      {checked ? (
        <Ionicons name="checkbox-outline" size={20} color="green" />
      ) : (
        <Ionicons name="square-outline" size={20} color="#fff" />
      )}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function App() {

  const [text, setText] = useState('');
  const [data, setData] = useState([] as dataType[])
  const [editText, setEditText] = useState('');
  const [editId, setEditId] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [time, setTime] = useState(new Date())
  const [filter, setFilter] = useState('all')

  const url = 'http://10.26.5.63:3000/todolist'

  useEffect(() => {
    fetchTodolist()
    // getStorage('todo_list').then(res => {
    //   if (res) {
    //     const list = JSON.parse(res)
    //     setData(list.map((item: any) => {
    //       return {
    //         ...item,
    //         datetime: new Date(item.datetime)
    //       }
    //     }))
    //   }
    // })
  }, [])

  const fetchTodolist = () => {
    axios.get(url).then(({ data }: any) => {
      if (data.code === 200) {
        const list = data.data.reverse().map((item: any) => {
          return {
            ...item,
            datetime: new Date(item.datetime)
          }
        })
        setData(list)
      }
    })
  }

  const handlePress = (id: string) => {
    const index = data.findIndex(elem => elem.id === id)
    const list = [...data]
    list[index].done = !list[index].done
    setData(list)
    setStorage('todo_list', JSON.stringify(list))
  };

  const addTodo = async () => {
    if (text) {

      const { data } = await axios.post(url, {
        id: `${+new Date()}`,
        title: text,
        done: false,
        image: image || '',
        latitude: location.coords ? location.coords.latitude.toFixed(2) : '',
        longitude: location.coords ? location.coords.longitude.toFixed(2) : '',
        datetime: time
      })

      if (data.code === 200) {
        // const list = [...data]
        // list.unshift({
        //   id: `${+new Date()}`,
        //   title: text,
        //   done: false,
        //   image: image || '',
        //   latitude: location.coords ? location.coords.latitude.toFixed(2) : '',
        //   longitude: location.coords ? location.coords.longitude.toFixed(2) : '',
        //   datetime: time
        // })
        // setData(list)
        setText('')
        setImage('')
        // setStorage('todo_list', JSON.stringify(list))
        fetchTodolist()
      }

    }
  }

  const handleDelete = async (id: string) => {

    const { data } = await axios.delete(url + '/' + id)
    if (data.code === 200) {
      fetchTodolist()
    }

    // const index = data.findIndex(elem => elem.id === id)
    // const list = [...data]
    // list.splice(index, 1)
    // setData(list)
    // setStorage('todo_list', JSON.stringify(list))
  }

  const showEdit = (id: string) => {
    const index = data.findIndex(elem => elem.id === id)
    setEditText(data[index].title)
    setEditId(id)
    setShowPopup(true)
  }
  const handleEdit = async () => {
    const index = data.findIndex(elem => elem.id === editId)
    const list = [...data]
    list[index].title = editText
    const res = await axios.put(url, list[index])
    if (res.data.code === 200) {
      fetchTodolist();
      setShowPopup(false)
    }
  }

  const [image, setImage] = useState('');
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result: ImagePicker.ImagePickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      if (result.assets.length) {
        const first = result.assets[0]
        setImage(first.uri);
      }
    }
  };

  const [location, setLocation] = useState({} as Location.LocationObject);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);


  const sendSms = async (title: string) => {

    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      const { result } = await SMS.sendSMSAsync(
        ['0123456789'],
        title,
      );
    } else {
      // misfortune... there's no SMS available on this device
    }

  }

  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      }
    })();
  }, []);

  const createCalendar = async (title: string, datetime: Date) => {
    const defaultCalendarSource =
      Platform.OS === 'ios'
        ? await getDefaultCalendarSource()
        : { isLocalAccount: true, name: 'Expo Calendar' } as any;
    const newCalendarID = await Calendar.createCalendarAsync({
      title: title,
      color: 'blue',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource.id,
      source: defaultCalendarSource,
      name: 'internalCalendarName',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    Alert.alert('add calendar success!');
  }

  const getDefaultCalendarSource = async () => {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.source;
  }

  const onDatetimeChange = async (event: any, date: Date) => {
    setTime(date)
  }

  const getFilterData = () => {
    if (filter == 'all') {
      return data
    } else if (filter == 'active') {
      return data.filter(item => !item.done)
    } else if (filter == 'completed') {
      return data.filter(item => item.done)
    } else {
      return []
    }
  }

  return (
    <View style={styles.container}>
     <View>
  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 }}>Add something to do </Text>
      
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#ccc', marginTop: 5 }}>
    <TextInput
      style={{ flex: 1, height: 40, color: '#000', paddingHorizontal: 10 }}
      placeholder="Input todo..."
      onChangeText={text => setText(text)}
      defaultValue={text}
    />
  </View>


</View>

<TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
        <Ionicons name="image" size={24} color="black" />
      </TouchableOpacity>

      {image ? <Image source={{ uri: image }} style={{ width: 100, height: 100 }} /> : null}
      {image && <Image source={{ uri: image }} style={{ width: 100, height: 100 }} />}
      <Datetimepicker value={time} onChange={onDatetimeChange}></Datetimepicker>
      {location.coords && <Text style={{ color: '#fff' }}>location: {location.coords.latitude.toFixed(2)},{location.coords.longitude.toFixed(2)}</Text>}
      <Text
        style={styles.addBtn}
        onPress={() => addTodo()}>
        Add
      </Text>

      <View style={styles.filter}>
  <Text style={[styles.filterBtn, { borderColor: '#a9a9a9', borderWidth: 1, borderRadius: 20, backgroundColor: filter === 'all' ? '#a9a9a9' : 'transparent' }]} onPress={() => setFilter('all')}>All</Text>
  <Text style={[styles.filterBtn, { borderColor: '#a9a9a9', borderWidth: 1, borderRadius: 20, backgroundColor: filter === 'active' ? '#a9a9a9' : 'transparent' }]} onPress={() => setFilter('active')}>Active</Text>
  <Text style={[styles.filterBtn, { borderColor: '#a9a9a9', borderWidth: 1, borderRadius: 20, backgroundColor: filter === 'completed' ? '#a9a9a9' : 'transparent' }]} onPress={() => setFilter('completed')}>Completed</Text>
</View>


      <ScrollView>
        {
          getFilterData().length ?
            <View style={{ alignItems: 'flex-start', width: 300 }}>
              {getFilterData().map((item: dataType) => (
                <View key={item.id} style={styles.item}>
                  <CheckBox
                    label={item.title}
                    checked={item.done}
                    onPress={() => { handlePress(item.id) }}
                  />
                  {item.image && <Image source={{ uri: item.image }} style={{ width: 100, height: 100 }} />}
                  <Text style={{ color: '#fff' }}>Location: {item.latitude},{item.longitude}</Text>
                  <Text style={{ color: '#fff' }}>Date: {item.datetime?.toLocaleDateString()}</Text>
                  <View style={styles.btnWrap}>
                    <Text style={styles.editBtn} onPress={() => { showEdit(item.id) }}>Edit</Text>
                    <Text style={styles.deleteBtn} onPress={() => { handleDelete(item.id) }}>Delete</Text>
                  </View>
                  <View style={styles.btnWrap}>
                    <Text style={styles.smsBtn} onPress={() => { sendSms(item.title) }}>SMS</Text>
                    <Text style={styles.calendarBtn} onPress={() => { createCalendar(item.title, item.datetime) }}>Calendar</Text>
                  </View>
                </View>
              ))}
            </View> :
            <View></View>
        }
      </ScrollView>

      {
        showPopup ? <View style={styles.popupWrap}>
          <TextInput
            style={{ height: 40, borderColor: 'gray', borderWidth: 1, width: 230, marginBottom: 8 }}
            placeholder="Input todo..."
            onChangeText={text => setEditText(text)}
            defaultValue={editText}
          />
          <Text
            style={styles.editBtn}
            onPress={() => handleEdit()}>
            Edit
          </Text>
        </View> : <View></View>
      }

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2f4f4f',
    alignItems: 'center',
    paddingTop: 64,
    color: '#ffc0cb'
  },
  
  imagePickerButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 10,
  },

  todoItem: {
    width: 300,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  todoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  todoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
 
 
  addBtn: {
    backgroundColor: '#fff',
    color: '#333',
    width: 300,
    textAlign: 'center',
    verticalAlign: 'middle',
    paddingTop: 8,
    paddingBottom: 8
  },
  filter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  filterBtn: {
    width: 100,
    textAlign: 'center',
    verticalAlign: 'middle',
    paddingTop: 8,
    paddingBottom: 8,
    borderColor: '#fff',
    borderWidth: 1,
    color: '#fff'
  },
  item: {
    width: 300,
    // paddingTop: 16,
    // paddingBottom: 8,
    padding: 16,
    borderColor: '#fff',
    borderWidth: 1,
    marginTop: 8

  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
    color: '#fff'
  },
  editBtn: {
    width: 129,
    textAlign: 'center',
    verticalAlign: 'middle',
    paddingTop: 4,
    paddingBottom: 4,
    borderColor: '#fff',
    borderWidth: 1,
    color: '#fff'
  },
  smsBtn: {
    width: 129,
    textAlign: 'center',
    verticalAlign: 'middle',
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#769bf8',
    borderColor: '#769bf8',
    borderWidth: 1,
    color: '#fff'
  },
  calendarBtn: {
    width: 129,
    textAlign: 'center',
    verticalAlign: 'middle',
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#ccc',
    borderColor: '#ccc',
    borderWidth: 1,
    color: '#fff'
  },
  deleteBtn: {
    width: 129,
    textAlign: 'center',
    verticalAlign: 'middle',
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#ba4641',
    color: '#fff',
  },
  btnWrap: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between'
  },
  popupWrap: {
    color: '#5f9ea0',
    position: 'absolute',
    top: 100,
    zIndex: 9,
    width: 260,
    height: 300,
    backgroundColor: '#5f9ea0',
    padding: 16
  },
});
