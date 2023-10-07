function getCocktailJsonPromise() {
  return fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php")
    .then(res => res.json())
    .then(cocktailRawRes => {
      return cocktailRawRes.drinks[0];
    });
};

function objectToMap({ object }) {
  return new Map(Object.entries(object));
}

/**
 * 
 * @param {Object} obj - Main Object.
 * @param {Object} obj.jsonObject - The parsed json made object.
 * @param {Map} obj.valuesMap - The map that represents the different values (key = oldValue, value = newValue).
 * @param {Map} obj.regexObjectMap - The map that represents every regex that represents an object, which properties will be the one's that matches the regex.
 * @param {boolean} obj.purgeNull - If the null values will be purged from the object or not (boolean).
 */
function regexKeysToArray({ jsonObject, valuesMap, regexesArrayMap, regexesObjectMap, purgeNull }) {
  let objectMap = objectToMap({ object: jsonObject });
  objectMap = renameProperties({ objectMap: objectMap, valuesMap: valuesMap });

}

function renameProperties({ objectMap, valuesMap }) {
  valuesMap
}

function purgeNullKeys({ map }) {
  let mapKeys = Array.from(map.keys());
  mapKeys.forEach(key => {
    let value = map.get(key);
    if (value === null) {
      map.delete(key);
    }
  })
  return map;
}