const targetMap = new WeakMap();

let activeEffect = null;

function track(target, property) {
  if (activeEffect) {
    // We get the correct depsMap using the target (reactive object)
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      depsMap = new Map();
      targetMap.set(target, depsMap);
    }

    // Get list of effects of dependency
    let dep = depsMap.get(property)
    if (!dep) {
      dep = new Set();
      depsMap.set(property, dep)
    }

    dep.add(activeEffect);
  }
}

function trigger(target, property) {
  // We get the correct depsMap using the target (reactive object)
  let depsMap = targetMap.get(target)
  if (!depsMap) return

  // Get list of effects of dependency
  let dep = depsMap.get(property)
  if (!dep) return

  // Run all the effects of this dependency
  dep.forEach(effect => {
    effect()
  })
}

class RefImpl {
  constructor(value) {
    this._value = value;
  }

  get value() {
    track(this, 'value');
    return this._value;
  }

  set value(newValue) {
    this._value = newValue;
    trigger(this, 'value');
  }
}

export function ref(rawValue) {
  return new RefImpl(rawValue);
}

export function reactive(targetObject) {
  return new Proxy(targetObject, {
    get(target, property) {
      track(target, property);
      return target[property];
    },
    set(target, property, value) {
      let oldValue = target[property];
      target[property] = value;
        // Call update function only if the value changed
        if (oldValue != value) {
          trigger(target, property);
      }

      return true;
    },
  })
}

export function watchEffect(effect) {
  activeEffect = effect;
  effect();
  activeEffect = null;
}
