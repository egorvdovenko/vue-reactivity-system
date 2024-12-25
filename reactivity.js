let activeEffect = null

export function watchEffect(effect) {
  activeEffect = effect
  activeEffect()
  activeEffect = null
}

const targetMap = new WeakMap()

function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      depsMap = new Map()
      targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if (!dep) {
      dep = new Set()
      depsMap.set(key, dep)
    }
    dep.add(activeEffect)
  }
}

function trigger(target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) return
  let dep = depsMap.get(key)
  if (!dep) return
  dep.forEach(effect => {
    effect()
  })
}

export function reactive(targetObject) {
  return new Proxy(targetObject, {
    get(target, key, receiver) {
      let result = Reflect.get(target, key, receiver)
      track(target, key)
      return result
    },
    set(target, key, value, receiver) {
      let oldValue = target[key]
      let result = Reflect.set(target, key, value, receiver)
      if (result && oldValue != value) {
        trigger(target, key)
      }
      return result
    },
  })
}

class RefImpl {
  constructor(value) {
    this._value = value
  }
  get value() {
    track(this, 'value')
    return this._value
  }
  set value(newValue) {
    this._value = newValue
    trigger(this, 'value')
  }
}

export function ref(rawValue) {
  return new RefImpl(rawValue)
}

export function computed(getter) {
  let result = ref()
  watchEffect(() => (result.value = getter()))
  return result
}