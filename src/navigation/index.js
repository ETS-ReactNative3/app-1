import React from 'react'
import { createBottomTabNavigator } from 'react-navigation'
import { connect } from 'react-redux'
import FontAwesome, { Icons } from 'react-native-fontawesome'
import {
  reduxifyNavigator,
  createReactNavigationReduxMiddleware,
} from 'react-navigation-redux-helpers'
import Bookmarks from '../components/Bookmarks'
import Messages from '../components/Messages'
import Profile from '../components/Profile'
import AddButton from '../components/AddButton'
import ProccessAddingImage from '../components/ProccessAddingImage'
import actions from '../actions'


const RootNavigator = createBottomTabNavigator({
  ...{
    Bookmarks: {
      screen: Bookmarks,
      navigationOptions: () => ({
        tabBarIcon: ({ tintColor }) => (
          <FontAwesome
            style={{
              fontSize: 24,
              color: tintColor,
            }}
          >
            {Icons.bookmark}
          </FontAwesome>
        ),
      }),
    },
  },
  ...{
    Feeds: {
      screen: Profile,
      navigationOptions: () => ({
        tabBarIcon: ({ tintColor }) => (
          <FontAwesome
            style={{
              fontSize: 24,
              color: tintColor,
            }}
          >
            {Icons.newspaperO}
          </FontAwesome>
        ),
      }),
    },
  },
  ...{
    Adding: {
      screen: ProccessAddingImage,
      navigationOptions: () => ({
        tabBarIcon: <AddButton ref={t => { this.addRef = t }} />,
        tabBarOnPress: () => this.addRef.store.dispatch(actions.toggleAddMenu()),
      }),
    },
    ...{
      Messages: {
        screen: Messages,
        navigationOptions: () => ({
          tabBarIcon: ({ tintColor }) => (
            <FontAwesome
              style={{
                fontSize: 24,
                color: tintColor,
              }}
            >
              {Icons.comment}
            </FontAwesome>
          ),
        }),
      },
    },
    Profile: {
      screen: Profile,
      navigationOptions: () => ({
        tabBarIcon: ({ tintColor }) => (
          <FontAwesome
            style={{
              fontSize: 24,
              color: tintColor,
            }}
          >
            {Icons.user}
          </FontAwesome>
        ),
      }),
    },
  },
},
{
  tabBarOptions: {
    showLabel: false,
    activeTintColor: '#66bfc7',
    inactiveTintColor: '#5b7495',
    style: {
      backgroundColor: '#3b4e68',
    },
    tabStyle: {},
  },
})

const middleware = createReactNavigationReduxMiddleware(
  'root',
  state => state.nav
)

const AppWithNavigationState = reduxifyNavigator(RootNavigator, 'root')

const mapStateToProps = state => ({
  state: state.nav,
})

const AppNavigator = connect(mapStateToProps)(AppWithNavigationState)

export { AppNavigator, RootNavigator, middleware }
