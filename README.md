# hass-scene-presets-card

This card was created for the Scene Presets integration by Hypfer (GitHub: [Hypfer/hass-scene_presets](https://github.com/Hypfer/hass-scene_presets)). I really love this custom component, but I was missing an easy way to activate a scene for specific targets directly from my dashboard. You could create a separate button for each scene, but this card solves that problem in one place.

### How it works

The card collects all scenes and categories, retrieves the image corresponding to each scene, and automatically builds a list view based on what it finds. This means that when new scenes are added, they will automatically appear in the card without any extra configuration.

### Disclaimer

I am by no means a developer. I simply had a vision and tried to bring it to life as best as I could with the resources available to me. If anyone can improve or refine it, please feel free to fork the project. I just wanted to share this card in case others might find it useful.

### Example config
```
type: custom:scene-presets-gallery-card
title: null
service: scene_presets.start_dynamic_scene
service_data:
  preset_id: "{{id}}"
  targets:
    entity_id:
      - light.bedroom_1
      - light.bedroom_2
      - light.bedroom_3
      - light.bedroom_4
columns: 2
show_controls: true
default_custom_brightness: false
show_background: false
haptic_feedback: true
```
### Screenshot
<img width="380" height="862" alt="image" src="https://github.com/user-attachments/assets/b5420e83-dab7-4cc7-aeb1-38fe7cfad7df" />
