import { NavigationActions } from 'react-navigation'
import { AsyncStorage, Alert } from 'react-native'
import moment from 'moment'
import API from '../common/API.js'

const btoa = require('Base64').btoa
const DeviceInfo = require('react-native-device-info')

const api = new API()

const setTokenAndUserInfo = (token) => {
  api.setToken(token)
  return api.fetchUserInfo()
    .then((info) =>
      AsyncStorage.setItem('user_info', JSON.stringify(info))
        .then(() => info)
    )
}

const deviceNameSafe = `m_g_i_o_s_${btoa(
  unescape(
    encodeURIComponent(DeviceInfo.getUniqueID())))
  .replace(/=/g, '')
  .toLowerCase()}`

const actions = {
  reportCreateOutfitIssues: (payload) => () => {
    api.report(Object.assign(payload, { type: 'CreateOutfit' }))
      .then(() =>
        Alert.alert('Thanks for reporting the issue, we will resolve it as soon as possible.'))
      .catch(() => {
        Alert.alert('Ops... Something went wrong, please try again later.')
      })
  },

  addUnreadThread: (threadId) => (dispatch) => {
    dispatch({ type: 'ADD_UNREAD_THREAD', payload: threadId })
  },

  removeUnreadThread: (threadId) => (dispatch) => {
    dispatch({ type: 'REMOVE_UNREAD_THREAD', payload: threadId })
  },

  addSubsctiption: (id) => () => {
    AsyncStorage.setItem('subscription_id', id)
      .then(() => api.addSubsctiption(id, 'IOS_NOTIFICATION'))
      .then(() => {})
      .catch(() => {})
  },

  refereshUserInfo: () => (dispatch) => {
    api.fetchUserInfo()
      .then((info) =>
        AsyncStorage.setItem('user_info', JSON.stringify(info))
          .then(() => dispatch({
            type: 'REFERESH_USER_INFO',
            payload: { ...info },
          }))
          .catch(() => {})
      )
      .catch(() => {})
  },

  createMessage: (threadId, text, media, products) => (dispatch) => {
    api.createMessage(threadId, text, media, products)
      .then(() => dispatch(actions.fetchTopMessages(threadId)))
      .catch(() => Alert.alert('Ops... Something went wrong, please try again later.'))
  },

  fetchButtomMessages: (threadId) => (dispatch, getState) => {
    const { messages } = getState()

    dispatch({ type: 'LOADING_MESSAGES_FETCH' })
    api.fetchMessages(threadId, messages.messagesPagination)
      .then((msgs) =>
        dispatch({ type: 'ADD_BOTTOM_MESSAGES', payload: msgs }) &&
        dispatch({ type: 'FINISHED_MESSAGES_FETCH' }))
      .catch(() => dispatch({ type: 'FINISHED_MESSAGES_FETCH' }))
  },

  fetchTopMessages: (threadId) => (dispatch) => {
    dispatch({ type: 'LOADING_MESSAGES_FETCH' })
    api.fetchMessages(threadId)
      .then((msgs) =>
        dispatch({ type: 'ADD_TOP_MESSAGES', payload: msgs }) &&
        dispatch({ type: 'FINISHED_MESSAGES_FETCH' }))
      .catch(() => dispatch({ type: 'FINISHED_MESSAGES_FETCH' }))
  },

  fetchMessages: (threadId) => (dispatch) => {
    dispatch({ type: 'LOADING_MESSAGES_FETCH' })
    dispatch({ type: 'CLEAR_MESSAGES' })
    api.fetchMessages(threadId)
      .then((msgs) =>
        dispatch({ type: 'REFERESH_MESSAGES', payload: msgs }) &&
        dispatch({ type: 'FINISHED_MESSAGES_FETCH' }) &&
        dispatch(actions.removeUnreadThread(threadId)))
      .catch(() => dispatch({ type: 'FINISHED_MESSAGES_FETCH' }))
  },

  setSelectedThreadId: (threadId, refetchThreads = false) => (dispatch) => {
    if (refetchThreads) {
      return dispatch({ type: 'SET_SELECTED_THREAD_ID', payload: threadId })
    }

    dispatch({ type: 'LOADING_THREAD_FETCH' })
    return api.fetchThreads(undefined, 0)
      .then((tds) =>
        dispatch({ type: 'GET_MORE_THREADS', payload: tds }) &&
        dispatch({ type: 'FINISHED_THREAD_FETCH' }) &&
        dispatch({ type: 'SET_SELECTED_THREAD_ID', payload: threadId }) &&
        dispatch(actions.updateUnreadThreads(tds.data)))
      .catch(() => dispatch({ type: 'FINISHED_THREAD_FETCH' }))
  },

  updateUnreadThreads: (threads) => (dispatch, getState) => {
    const { user } = getState()

    threads.forEach(thread => {
      const isFromMe = thread.from.username === user.username

      if (isFromMe &&
        moment(thread.to_last_message_at) > moment(thread.from_last_message_read_at)) {
        dispatch(actions.addUnreadThread(thread.id))
      }

      if (!isFromMe &&
        moment(thread.from_last_message_at) > moment(thread.to_last_message_read_at)) {
        dispatch(actions.addUnreadThread(thread.id))
      }
    })
  },

  getMoreThreads: () => (dispatch, getState) => {
    const { messages } = getState()

    if (messages.threadLoading) { return }

    dispatch({ type: 'LOADING_THREAD_FETCH' })
    api.fetchThreads(undefined, messages.pagination)
      .then((tds) =>
        dispatch({ type: 'GET_MORE_THREADS', payload: tds }) &&
        dispatch({ type: 'FINISHED_THREAD_FETCH' }) &&
        dispatch(actions.updateUnreadThreads(tds.data)))
      .catch(() => dispatch({ type: 'FINISHED_THREAD_FETCH' }))
  },

  refetchTopThreads: () => (dispatch) => {
    api.fetchThreads(undefined, 0)
      .then((tds) =>
        dispatch({ type: 'REFETCH_TOP_THREADS', payload: tds }) &&
        dispatch(actions.updateUnreadThreads(tds.data)))
      .catch(() => {})
  },

  moveToPage: (page) => (dispatch) => {
    dispatch(NavigationActions.navigate({ routeName: page }))
  },

  colorSuggestionImagePicked: () => (dispatch) => {
    dispatch(
      NavigationActions.navigate({ routeName: 'Adding' })
    )
  },

  getColorPalletRecommendation: (base) => (dispatch) => {
    api.fetchColorPalletRecommendation(base)
      .then(recoms => dispatch({
        type: 'UPDATE_COLOR_PALLET_SUGGESTION',
        payload: [...recoms],
      }))
  },

  refreshBookmarks: () => (dispatch) => {
    AsyncStorage.getItem('color_bookmarks')
      .then((bms) => bms && dispatch({
        type: 'UPDATE_COLOR_PALLET_BOOKMARKS',
        payload: [...JSON.parse(bms)],
      }))

    api.getColorPalletBookmarks()
      .then(pallets => {
        dispatch({
          type: 'UPDATE_COLOR_PALLET_BOOKMARKS',
          payload: [...pallets.data],
        })
        AsyncStorage.setItem('color_bookmarks', JSON.stringify(pallets.data))
      })

    AsyncStorage.getItem('product_bookmarks')
      .then((bms) => bms && dispatch({
        type: 'UPDATE_PRODUCT_BOOKMARKS',
        payload: [...JSON.parse(bms)],
      }))

    api.getProductBookmarks()
      .then(p => {
        dispatch({
          type: 'UPDATE_PRODUCT_BOOKMARKS',
          payload: [...p.data],
        })
        AsyncStorage.setItem('product_bookmarks', JSON.stringify(p.data))
      })
  },

  refreshColorCode: () => (dispatch) => {
    AsyncStorage.getItem('color_codes')
      .then((data) => data && dispatch({
        type: 'UPDATE_COLOR_CODE',
        payload: [...JSON.parse(data)],
      }))

    api.fetchColorCodes()
      .then(data => {
        dispatch({
          type: 'UPDATE_COLOR_CODE',
          payload: [...data],
        })
        AsyncStorage.setItem('color_code', JSON.stringify(data))
      })
  },

  refreshCategories: () => (dispatch) => {
    AsyncStorage.getItem('categories')
      .then((data) => data && dispatch({
        type: 'UPDATE_CATEGORIES',
        payload: [...JSON.parse(data)],
      }))

    api.fetchCategories()
      .then(data => {
        dispatch({
          type: 'UPDATE_CATEGORIES',
          payload: [...data],
        })
        AsyncStorage.setItem('categories', JSON.stringify(data))
      })
  },

  deleteBookmarkedColorPallet: (palletId) => (dispatch) => {
    api.deleteBookmarkedColorPallet(palletId)
      .then(() => dispatch(actions.refreshBookmarks()))
  },

  bookmarkColorPallet: (palletId, title) => (dispatch) => {
    api.bookmarkColorPallet(palletId, title)
      .then(() => dispatch(actions.refreshBookmarks()))
  },

  deleteBookmarkedProduct: (productId, palletId) => (dispatch) => {
    api.deleteBookmarkedProduct(productId, palletId)
      .then(() => dispatch(actions.refreshBookmarks()))
  },

  bookmarkProduct: (productId, palletId, title) => (dispatch) => {
    api.bookmarkProduct(productId, palletId, title)
      .then(() => dispatch(actions.refreshBookmarks()))
  },

  fetchProducts: (q) => (dispatch) => {
    dispatch({ type: 'CLEAR_PRODUCT_SUGGESTION' })
    dispatch({ type: 'LOADING_PRODUCT_SUGGESTION' })

    api.fetchUserProducts('zzz', q)
      .then(products => {
        dispatch({
          type: 'RENEW_PRODUCT_SUGGESTION',
          payload: {
            items: [...products.data],
            pagination: products.pagination,
            queries: { ...q },
          },
        })
      })
  },

  fetchMoreProducts: () => (dispatch, getState) => {
    const { productSuggestion } = getState()

    if (productSuggestion.loading || productSuggestion.finished) {
      return
    }

    dispatch({ type: 'LOADING_PRODUCT_SUGGESTION' })

    api.fetchUserProducts('zzz', productSuggestion.queries, productSuggestion.pagination)
      .then(products => {
        dispatch({
          type: 'ADD_TO_PRODUCT_SUGGESTION',
          payload: {
            items: [...products.data],
            pagination: products.pagination,
          },
        })
      })
  },

  askForApproval: (metadata) => () => {
    api.askForApproval(metadata)
    .then(() =>
      AsyncStorage.setItem('guest_submitted', 'true'))
    .then(() =>
      Alert.alert('Thanks for your submission. We will inform you when your account is ready.'))
    .catch(() =>
      Alert.alert('Ops... Something went wrong, please try again later.'))
  },

  toggleAddMenu: () => (dispatch) => {
    dispatch({
      type: 'TOGGLE_ADD_MENU',
    })
  },

  colorSuggestionImageResized: image => (dispatch) => {
    dispatch({
      type: 'COLOR_SUGGESTION_IMAGE_PICKED',
      payload: { image },
    })

    api.uploadImage(image)
      .then(imageMetaDate =>
        dispatch({
          type: 'COLOR_SUGGESTION_IMAGE_UPLOADED',
          payload: imageMetaDate,
        })
      )
  },

  userInitiated: (info) => (dispatch) => {
    dispatch({ type: 'USER_INITIATED', payload: info })
    dispatch(actions.refreshBookmarks())
    dispatch(actions.refreshCategories())
    dispatch(actions.refreshColorCode())
    dispatch(actions.getMoreThreads())

    AsyncStorage.getItem('subscription_id')
      .then((sid) => sid && dispatch(actions.addSubsctiption(sid)))
  },

  loginUser: (username, password) => (dispatch) => {
    dispatch({ type: 'LOGGING_IN' })

    api.login({ username: `m_g_i_o_s_${username}`, password })
      .then(token =>
        setTokenAndUserInfo(token)
          .then(info => dispatch(actions.userInitiated(info))))
      .catch(e => {
        dispatch({ type: 'LOGIN_FAILED', payload: e })
      })
  },

  registerUser: (username, password, email, fullname) => (dispatch, getState) => {
    dispatch({ type: 'REGISTERING_USER' })

    api.register({
      username: `m_g_i_o_s_${username}`,
      password,
      email,
      full_name: fullname,
      invite_code: deviceNameSafe,
    })
      .then(token => setTokenAndUserInfo(token))
      .then(info =>
        Promise.all(getState()
          .bookmarks.reverse()
          .map(cp => api.bookmarkColorPallet(cp.id, cp.title)))
          .then(() => info)
          .catch(() => info))
      .then(info => dispatch(actions.userInitiated(info)))
      .catch(e => dispatch({ type: 'USER_REGISTRATION_FAILED', payload: e }))
  },

  logoutUser: () => (dispatch) => {
    AsyncStorage.removeItem('user_info')
      .then(() =>
        AsyncStorage.removeItem('guest_submitted'))
      .then(() => dispatch(actions.initiateUser()))
  },

  initiateUser: () => (dispatch) => {
    AsyncStorage.getItem('user_info')
      .then(info => {
        if (info) {
          return dispatch(actions.userInitiated(JSON.parse(info)))
        }

        return api.login({
          username: deviceNameSafe,
          password: deviceNameSafe,
        })
          .then(token =>
            setTokenAndUserInfo(token)
              .then(i => dispatch(actions.userInitiated(i))))
          .catch(e => {
            if (e.message !== '401') {
              return
            }

            api.register({
              username: deviceNameSafe,
              password: deviceNameSafe,
              email: `${deviceNameSafe}@guest.guest`,
              full_name: deviceNameSafe,
              invite_code: deviceNameSafe,
            })
              .then(token => setTokenAndUserInfo(token))
              .then(i => dispatch(actions.userInitiated(i)))
              .catch(err => dispatch({ type: 'USER_INITIATION_FAILED', payload: err }))
          })
      })
  },
}

export default actions
