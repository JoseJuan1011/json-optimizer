async function getCocktailJsonPromise() {
  return fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php")
    .then((res) => res.json())
    .then((cocktailRawRes) => {
      return cocktailRawRes.drinks[0];
    });
}

function objectToMap({ object }) {
  return new Map(Object.entries(object));
}

function purgeNullKeys({ map }) {
  let mapKeys = Array.from(map.keys());
  mapKeys.forEach((key) => {
    let value = map.get(key);
    if (value === null) {
      map.delete(key);
    }
  });
  return map;
}

/**
 *
 * @param {Object} obj
 * @param {Map<String, Object>} obj.objectMap
 * @param {Map<String, Object>} obj.valuesMap
 */
function renameSingleProperties({ objectMap, valuesMap }) {
  const iterator = valuesMap.entries();

  let currentValue = iterator.next();
  while (!currentValue.done) {
    let currentValueIndex = currentValue.value[0];
    let newIndex = currentValue.value[1];
    let currentValueValue = objectMap.get(currentValueIndex);

    objectMap.delete(currentValueIndex);
    objectMap.set(newIndex, currentValueValue);
    currentValue = iterator.next();
  }

  return objectMap;
}

/**
 * 
 * @param {Object} obj
 * @param {Map<string, Object>} obj.objectMap
 * @param {Map<string, RegExp>} obj.regexArrayMap
 */
function fromSingleToArrayProperties({
  objectMap,
  regexArrayMap
}) {
  /* 
  First loop the regexArrayMap, and convert get a separated object called "regexObject", 
  which will represent all the final keys of the objectMap, and depending if it matches one or another regex.
  
  Then, you check every key to see if it matches any of the regex themselves. 
  */
  const entriesIterator = objectMap.entries();

  let currentValue = entriesIterator.next();
  while (!currentValue.done) {
    

    currentValue = entriesIterator.next();
  }
}

/**
 *
 * @param {Object} obj - Main Object.
 * @param {Object} obj.jsonObject - The parsed json made object.
 * @param {Map} obj.valuesMap - The map that represents the different values (key = oldValue, value = newValue).
 * @param {Map} obj.regexArrayMap - The map that represents every key that is going to represent an Array, which properties names will be the one's that matches the regex.
 * @param {Map} obj.regexObjectMap - The map that represents every key that is going to represent an Object, which properties names will be the one's that matches the regex.
 * @param {boolean} obj.purgeNull - If the null values will be purged from the object or not (boolean).
 */
function regexKeysToArray({
  jsonObject,
  valuesMap = new Map(),
  regexArrayMap = new Map(),
  regexObjectMap = new Map(),
  purgeNull,
}) {
  let objectMap = objectToMap({ object: jsonObject });
  if (purgeNull) {
    objectMap = purgeNullKeys({ map: objectMap });
  }
  if (valuesMap.size > 0) {
    objectMap = renameSingleProperties({
      objectMap: objectMap,
      valuesMap: valuesMap,
    });
  }
  if (regexArrayMap.size > 0) {
    objectMap = fromSingleToArrayProperties({
      objectMap: objectMap,
      regexArrayMap: regexArrayMap,
    });
  }
  if (regexObjectMap.size > 0) {
  }

  return Object.fromEntries(objectMap.entries());
}



getCocktailJsonPromise().then((res) => {
  const object = res;
  
  const valuesMap = new Map([
    ["idDrink", "id"],
    ["strCategory", "category"],
  ]);

  const finalObject = regexKeysToArray({
    jsonObject: object,
    valuesMap: valuesMap,
    purgeNull: true,
  });

  console.log(finalObject);
});
