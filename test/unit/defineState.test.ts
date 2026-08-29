import { computed, reactive, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineState } from "../../src/runtime/app/composables/defineState";
import { setCurrentNuxtApp } from "./nuxt-app-mock";

describe("defineState", () => {
  beforeEach(() => setCurrentNuxtApp({}));

  it("is lazy and invokes its factory once per Nuxt app", () => {
    const factory = vi.fn(() => ({ value: ref(0) }));
    const useExample = defineState(factory);

    expect(factory).not.toHaveBeenCalled();
    useExample();
    useExample();

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("returns the exact same object to every caller in one app", () => {
    const useExample = defineState(() => ({ value: ref(0) }));

    expect(useExample()).toBe(useExample());
  });

  it("creates isolated objects for different Nuxt apps", () => {
    const useExample = defineState(() => ({ value: ref(0) }));
    const firstApp = {};
    const secondApp = {};

    setCurrentNuxtApp(firstApp);
    const first = useExample();
    first.value.value = 42;

    setCurrentNuxtApp(secondApp);
    const second = useExample();

    expect(second).not.toBe(first);
    expect(second.value.value).toBe(0);

    setCurrentNuxtApp(firstApp);
    expect(useExample()).toBe(first);
    expect(useExample().value.value).toBe(42);
  });

  it("preserves standard ref, reactive, computed, and function behavior", () => {
    const useCounter = defineState(() => {
      const count = ref(1);
      const profile = reactive({ name: "Guest" });
      const double = computed(() => count.value * 2);
      const increment = (amount = 1) => (count.value += amount);

      return { count, profile, double, increment };
    });

    const first = useCounter();
    const second = useCounter();
    first.count.value++;
    second.profile.name = "Nuxt User";
    second.increment(3);

    expect(first.count.value).toBe(5);
    expect(first.double.value).toBe(10);
    expect(first.profile.name).toBe("Nuxt User");
  });

  it("keeps multiple defineState closures independent", () => {
    const useFirst = defineState(() => ({ value: ref("first") }));
    const useSecond = defineState(() => ({ value: ref("second") }));

    expect(useFirst()).not.toBe(useSecond());
    useFirst().value.value = "changed";
    expect(useSecond().value.value).toBe("second");
  });

  it("rejects async factories at runtime for JavaScript callers", async () => {
    const useAsyncState = defineState((async () => ({ value: 1 })) as never);

    expect(() => useAsyncState()).toThrowError(
      "[nuxt-state] State factories must be synchronous.",
    );
  });
});
