<script setup lang="ts">
const auth = useLayerAuth()
const priority = useLayerPriority()
const project = useProjectState()
const permissions = useLayerPermissions()
const settings = useLayerSettings()
const navigation = useNestedLayerNavigation()
const extended = useExtendedLayerState()
const packageState = usePackageLayerState()
</script>

<template>
  <main>
    <output id="layer-auth">{{ auth.origin }}</output>
    <output id="layer-priority">{{ priority.origin }}</output>
    <output id="layer-project">{{ project.value }}</output>
    <output id="layer-permissions">{{ permissions.value }}</output>
    <output id="layer-settings">{{ settings.value }}</output>
    <output id="layer-navigation">{{ navigation.value }}</output>
    <output id="layer-extended">{{ extended.value }}</output>
    <output id="layer-package">{{ packageState.value }}</output>
  </main>
</template>
