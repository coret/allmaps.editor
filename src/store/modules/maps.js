import Vue from 'vue'

function makeMapActive(rootState, mapId, commit) {
  if (rootState.ui.activeMapId !== mapId) {
    commit('ui/setActiveMapId', { mapId }, { root: true })
  }
}

function makeOtherMapActive(rootState, mapId, commit) {
  if (rootState.ui.activeMapId !== mapId) {
    return
  }

  let otherMapId
  for (let loopMapId of Object.keys(rootState.maps.maps)) {
    if (loopMapId !== mapId) {
      otherMapId = loopMapId
      break
    }
  }

  commit('ui/setActiveMapId', { mapId: otherMapId }, { root: true })
}

function groupMapsByImageId(mapsByMapId) {
  let mapsByImageId = {}

  for (let map of Object.values(mapsByMapId)) {
    const imageId = map.image.id

    if (!mapsByImageId[imageId]) {
      mapsByImageId[imageId] = []
    }

    mapsByImageId[imageId].push(map)
  }

  return mapsByImageId
}

const state = () => ({
  maps: {},
  previousMaps: {}
})

const getters = {
  activeMap: (state, getters, rootState) => {
    const activeMapId = rootState.ui.activeMapId
    const activeMap = state.maps[activeMapId]
    return activeMap
  },

  mapsByImageId: (state) => {
    return groupMapsByImageId(state.maps)
  },

  previousMapsByImageId: (state) => {
    return groupMapsByImageId(state.previousMaps)
  }

  // mapsForActiveImage: (state, getters, rootState) => {
  //   const activeImageId = rootState.ui.activeImageId
  //   return Object.keys(state.maps)
  //     .filter((id) => state.maps[id].image.id === activeImageId)
  //     .reduce((maps, id) => ({
  //       ...maps,
  //       [id]: state.maps[id]
  //     }), {})
  // }
}

const actions = {
  setMaps({ commit, rootState }, { maps, source }) {
    commit('setMaps', { maps, source })

    if (Object.keys(maps).length) {
      const firstMapId = Object.keys(maps)[0]
      if (firstMapId) {
        makeMapActive(rootState, firstMapId, commit)
      }
    }
  },

  resetMaps({ dispatch }) {
    dispatch('setMaps', { maps: {} })
  },

  insertMap(
    { commit, rootState },
    { mapId, pixelMask = [], gcps = {}, image, source }
  ) {
    const map = {
      version: 1,
      id: mapId,
      image,
      pixelMask,
      gcps
    }

    commit('insertMap', { mapId, map, source })
    makeMapActive(rootState, mapId, commit)
  },

  removeMap({ commit, rootState }, { mapId, source }) {
    makeOtherMapActive(rootState, mapId, commit)
    commit('removeMap', { mapId, source })
  },

  insertPixelMaskPoint(
    { state, commit, rootState },
    { mapId, index, pixelMaskPoint, source }
  ) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    commit('insertPixelMaskPoint', {
      mapId,
      index,
      pixelMaskPoint,
      source
    })

    makeMapActive(rootState, mapId, commit)
  },

  replacePixelMaskPoint(
    { commit, rootState },
    { mapId, index, pixelMaskPoint, source }
  ) {
    commit('replacePixelMaskPoint', {
      mapId,
      index,
      pixelMaskPoint,
      source
    })

    makeMapActive(rootState, mapId, commit)
  },

  removePixelMaskPoint({ commit, rootState }, { mapId, index, source }) {
    commit('removePixelMaskPoint', {
      mapId,
      index,
      source
    })

    makeMapActive(rootState, mapId, commit)
  },

  insertGcp({ state, commit }, { mapId, gcpId, gcp, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    if (state.maps[mapId].gcps[gcpId]) {
      throw new Error(`GCP ${gcpId} already exists`)
    }

    commit('insertGcp', {
      mapId,
      gcpId,
      gcp,
      source
    })
  },

  replaceGcp({ state, commit }, { mapId, gcpId, gcp, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    if (!state.maps[mapId].gcps[gcpId]) {
      throw new Error(`GCP ${gcpId} does not exist`)
    }

    commit('replaceGcp', {
      mapId,
      gcpId,
      gcp,
      source
    })
  },

  removeGcp({ state, commit }, { mapId, gcpId, gcp, source }) {
    if (!state.maps[mapId]) {
      throw new Error(`Map ${mapId} does not exist`)
    }

    if (!state.maps[mapId].gcps[gcpId]) {
      throw new Error(`GCP ${gcpId} does not exist`)
    }

    commit('removeGcp', {
      mapId,
      gcpId,
      gcp,
      source
    })
  }
}

const mutations = {
  setMaps(state, { maps }) {
    state.previousMaps = { ...state.previousMaps, ...state.maps }
    state.maps = maps
  },

  insertMap(state, { mapId, map }) {
    if (!state.maps[mapId]) {
      Vue.set(state.maps, mapId, map)

      // In Vue 3:
      // state.maps = {
      //   ...state.maps,
      //   [mapId]: map
      // }
    } else {
      throw new Error('Map already exists!')
    }
  },

  removeMap(state, { mapId }) {
    Vue.delete(state.maps, mapId)

    // In Vue 3:
    // delete state.maps[mapId]
  },

  insertPixelMaskPoint(state, { mapId, index, pixelMaskPoint }) {
    const map = state.maps[mapId]

    const pixelMask = map.pixelMask
    pixelMask.splice(index, 0, pixelMaskPoint)

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  replacePixelMaskPoint(state, { mapId, index, pixelMaskPoint }) {
    const map = state.maps[mapId]
    map.pixelMask[index] = pixelMaskPoint

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  removePixelMaskPoint(state, { mapId, index }) {
    const map = state.maps[mapId]
    map.pixelMask.splice(index, 1)

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  insertGcp(state, { mapId, gcpId, gcp }) {
    const map = state.maps[mapId]

    Vue.set(map.gcps, gcpId, {
      id: gcpId,
      ...gcp
    })

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // map.gcps = {
    //   ...map.gcps,
    //   [gcpId]: {
    //     id: gcpId,
    //     ...gcp
    //   }
    // }

    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  replaceGcp(state, { mapId, gcpId, gcp }) {
    const map = state.maps[mapId]

    Vue.set(map.gcps, gcpId, {
      id: gcpId,
      ...gcp
    })

    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // map.gcps = {
    //   ...map.gcps,
    //   [gcpId]: {
    //     id: gcpId,
    //     ...gcp
    //   }
    // }

    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  },

  removeGcp(state, { mapId, gcpId }) {
    const map = state.maps[mapId]

    Vue.delete(map.gcps, gcpId)
    Vue.set(state.maps, mapId, map)

    // In Vue 3:
    // delete map.gcps[gcpId]

    // state.maps = {
    //   ...state.maps,
    //   [mapId]: map
    // }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
