import { fetchJson } from '../../lib/api.js'

const state = () => ({
  sidebarOpen: false,
  drawerOpen: undefined,
  lastError: undefined,
  activeImageId: undefined,
  activeMapId: undefined,
  loading: false,
  projects: [],
  callback: undefined
})

const getters = {
  activeImage: (state, getters, rootState) => {
    return rootState.iiif.imagesById[state.activeImageId]
  },

  previousMapId: (state, getters, rootState) => {
    if (!state.activeMapId) {
      return
    }

    const mapIds = Object.keys(rootState.maps.maps)
    const currentMapIndex = mapIds.indexOf(state.activeMapId)
    const newMapIndex = (currentMapIndex - 1 + mapIds.length) % mapIds.length
    return mapIds[newMapIndex]
  },

  nextMapId: (state, getters, rootState) => {
    if (!state.activeMapId) {
      return
    }

    const mapIds = Object.keys(rootState.maps.maps)
    const currentMapIndex = mapIds.indexOf(state.activeMapId)
    const newMapIndex = (currentMapIndex + 1 + mapIds.length) % mapIds.length
    return mapIds[newMapIndex]
  },

  callbackProject: (state) => {
    if (!state.callback) {
      return
    }

    for (let project of state.projects) {
      for (let hostname of project.hostnames) {
        const url = new URL(state.callback)
        if (url.hostname === hostname) {
          return project.label
        }
      }
    }
  }
}

const actions = {
  reset({ commit }) {
    commit('reset')
  },

  setActiveImageId({ commit, dispatch, rootState }, { imageId }) {
    if (!rootState.iiif.imagesById[imageId]) {
      // return
      throw new Error(`Image ID does not exist in IIIF source: ${imageId}`)
    }

    dispatch('maps/resetMaps', { maps: {} }, { root: true })

    if (rootState.iiif.imagesById[imageId].parsedImage.embedded) {
      dispatch('iiif/loadImageInfo', { imageId }, { root: true })
    }

    commit('setActiveImageId', { imageId })
    commit('setActiveMapId', { mapId: undefined })
  },

  setActiveMapId({ commit, rootState }, { mapId }) {
    if (rootState.maps.maps[mapId]) {
      commit('setActiveMapId', { mapId })
    }
  },

  setSidebarOpen({ state, commit }, { open }) {
    if (state.sidebarOpen !== open) {
      commit('setSidebarOpen', { open })
    }
  },

  toggleDrawer({ state, commit }, drawer) {
    const drawerOpen = state.drawerOpen === drawer ? undefined : drawer
    commit('setDrawerOpen', { drawer: drawerOpen })
  },

  setCallback({ commit }, callback) {
    if (!callback || callback.length === 0) {
      return
    }

    commit('setCallback', { callback })
  },

  async setProjectsUrl({ commit }, url) {
    if (!url) {
      return
    }

    const projects = await fetchJson(url)
    commit('setProjects', { projects })
  }
}

const mutations = {
  reset(state) {
    state.sidebarOpen = false
    state.drawerOpen = undefined
    state.lastError = undefined
    state.activeImageId = undefined
    state.activeMapId = undefined
    state.loading = true
  },
  setActiveImageId(state, { imageId }) {
    state.activeImageId = imageId
  },
  setActiveMapId(state, { mapId }) {
    state.activeMapId = mapId
  },
  setSidebarOpen(state, { open }) {
    state.sidebarOpen = open
  },
  setDrawerOpen(state, { drawer }) {
    state.drawerOpen = drawer
  },
  setProjects(state, { projects }) {
    state.projects = projects
  },
  setCallback(state, { callback }) {
    state.callback = callback
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
