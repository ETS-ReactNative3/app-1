import React, {Component} from 'react';
import {Text, SafeAreaView, View} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { connect } from 'react-redux'
import actions from '../actions'
import ColorPallet from './ColorPallet'
import FontAwesome, { Icons } from 'react-native-fontawesome'

class Bookmarks extends Component {

  render() {
    const {bookmarks} = this.props
    console.log(bookmarks);
    return (
      <SafeAreaView style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {(!bookmarks || bookmarks.length <= 0) &&
              <View style={{
                width: '50%',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesome style={{fontSize: 70, color: '#3b4e68'}}>
                  {Icons.road}
                </FontAwesome>
                <Text style={{textAlign: 'center', marginTop: 5}}>It's lonely here!</Text>
                <Text style={{textAlign: 'center', marginTop: 10}}>Start adding color schemes by clicking on + button</Text>
              </View>}


        {bookmarks && bookmarks.length > 0 && <KeyboardAwareScrollView style={{
          height: '100%',
          width: '100%'
        }}>
          {bookmarks.map((cp, i) => {
            return (<ColorPallet
              showTitle={true}
              key={i}
              base={cp}
            />)
          })}
        </KeyboardAwareScrollView>}
      </SafeAreaView>
    );
  }
}

const mapStateToProps = state => {
  return { bookmarks: state.bookmarks }
}

const mapDispatchToProps = dispatch => ({
  bookmarkColorPallet: (palletId) =>
    dispatch(actions.bookmarkColorPallet(palletId)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Bookmarks);
