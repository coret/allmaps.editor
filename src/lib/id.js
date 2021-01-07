import perma from 'perma'

const DATABASE_LENGTH = 16
const URL_LENGTH = 16

export function randomId () {
  return databaseId(String(Math.random()))
}

export function databaseId (uri) {
  return perma(uri, DATABASE_LENGTH)
}