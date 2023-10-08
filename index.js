const VALUE_TYPES = new Map([
  ["Array", Symbol("Array")],
  ["Object", Symbol("Object")],
]);

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
   * @param {String} obj.key
   * @param {Map<String, RegExp>} obj.regexArrayMap 
   * @param {Array<Array>} obj.regexValues 
   * @param {Map<String, Object>} obj.objectMap
   */
const anyRegexKeyMatchingKey = ({key, value, regexArrayMap, regexValues, objectMap}, {valueType = VALUE_TYPES.get("Array")}) => {
  const valueTypesActions = new Map([
    [VALUE_TYPES.get("Array"), (keyValues) => {
      keyValues.push(value);
      return keyValues;
    }],
    [VALUE_TYPES.get("Object"), (keyValues) => {
      keyValues[key] = value;
      return keyValues;
    }],
  ]);
  
  const entriesIterator = regexArrayMap.entries();

  let currentValue = entriesIterator.next();
  while (!currentValue.done) {
    const newKey = currentValue.value[0];
    const regex = currentValue.value[1];

    const keyMatchesRegex = regex.test(key);

    if (keyMatchesRegex) {
      const indexNewKey = regexValues.findIndex((value) => value[0] === newKey);
      
      let keyValues = regexValues[indexNewKey][1];

      keyValues = valueTypesActions.get(valueType)(keyValues);

      objectMap.delete(key);
    }
    currentValue = entriesIterator.next();
  }

  return [regexValues, objectMap];
};

function extractRegexValues(regexMap, valueType = VALUE_TYPES.get("Array")) {
  const regexValues = [];

  const regexMapEntries = regexMap.entries();

  let currentRegex = regexMapEntries.next();
  while (!currentRegex.done) {
    const currentRegexKey = currentRegex.value[0];
    const valueTypeConversion = {
      [VALUE_TYPES.get("Array")]: [],
      [VALUE_TYPES.get("Object")]: {},
    };

    const finalValue = [currentRegexKey, valueTypeConversion[valueType]];
    regexValues.push(finalValue);

    currentRegex = regexMapEntries.next();
  }

  return regexValues;
}

/**
 *
 * @param {Object} obj
 * @param {Map<string, Object>} obj.objectMap
 * @param {Map<string, RegExp>} obj.regexArrayMap
 */
function fromSingleToArrayProperties ({
  objectMap,
  regexArrayMap
}) {
  /*
  First loop the regexArrayMap, and convert get a separated object called "regexObject",
  which will represent all the final keys of the objectMap, and depending if it matches one or another regex.

  Then, you check every key to see if it matches any of the regex themselves.
  */
  /**
   * @type {Array<Array>}
   */
  let regexValues = extractRegexValues(regexArrayMap, VALUE_TYPES.get("Array"));

  const entriesIterator = objectMap.entries();

  let currentValue = entriesIterator.next();
  while (!currentValue.done) {
    const currentValueKey = currentValue.value[0];
    const currentValueValue = currentValue.value[1];
    
    [regexValues, objectMap] = anyRegexKeyMatchingKey({
      key: currentValueKey,
      value: currentValueValue,
      regexArrayMap: regexArrayMap,
      regexValues: regexValues,
      objectMap: objectMap,
    }, {valueType: VALUE_TYPES.get("Array")});

    currentValue = entriesIterator.next();
  }

  regexValues = regexValues.filter((value) => value[1].length > 0);
  regexValues.forEach((value) => {
    objectMap.set(value[0], value[1]);
  });

  return objectMap;
}

/**
 * 
 * @param {Object} obj
 * @param {Map<string, Object>} obj.objectMap
 * @param {Map<string, RegExp>} obj.regexObjectMap
 */
function fromSingleToObjectProperties({
  objectMap,
  regexObjectMap,
}) {
  /**
   * @type {Array<Array>}
   */
  let regexValues = extractRegexValues(regexObjectMap, VALUE_TYPES.get("Object"));

  const entriesIterator = objectMap.entries();

  let currentValue = entriesIterator.next();
  while (!currentValue.done) {
    const currentValueKey = currentValue.value[0];
    const currentValueValue = currentValue.value[1];
    
    [regexValues, objectMap] = anyRegexKeyMatchingKey({
      key: currentValueKey,
      value: currentValueValue,
      regexArrayMap: regexObjectMap,
      regexValues: regexValues,
      objectMap: objectMap,
    }, {valueType: VALUE_TYPES.get("Object")});

    currentValue = entriesIterator.next();
  }

  regexValues = regexValues.filter((value) => Object.keys(value[1]).length > 0);
  regexValues.forEach((value) => {
    objectMap.set(value[0], value[1]);
  });

  return objectMap;
}

/**
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
    objectMap = fromSingleToObjectProperties({
      objectMap: objectMap,
      regexObjectMap: regexObjectMap,
    });
  }

  return Object.fromEntries(objectMap.entries());
}

getCocktailJsonPromise().then((res) => {
  const object = res;
  
  const valuesMap = new Map([
    ["idDrink", "id"],
    ["strCategory", "category"],
  ]);

  const regexArrayMap = new Map([
    ["ingredients", /strIngredient/],
    ["measures", /strMeasure/],
  ]);

  const regexObjectMap = new Map([
    ["imgInfo", /strImage|strImageSource|strDrinkThumb|strCreativeCommonsConfirmed/]
  ]);

  const finalObject = regexKeysToArray({
    jsonObject: object,
    valuesMap: valuesMap,
    regexArrayMap: regexArrayMap,
    regexObjectMap: regexObjectMap,
    purgeNull: true,
  });

  console.log(JSON.stringify(finalObject, null, 2));
});
