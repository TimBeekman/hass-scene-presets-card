# hass-scene-presets-card

This card was created for the Scene Presets integration by Hypfer (GitHub: [Hypfer/hass-scene_presets](https://github.com/Hypfer/hass-scene_presets)). I really love this custom component, but I was missing an easy way to activate a scene for specific targets directly from my dashboard. You could create a separate button for each scene, but this card solves that problem in one place.

### How it works

The card collects all scenes and categories, retrieves the image corresponding to each scene, and automatically builds a list view based on what it finds. This means that when new scenes are added, they will automatically appear in the card without any extra configuration.

### Disclaimer

I am by no means a developer. I simply had a vision and tried to bring it to life as best as I could with the resources available to me. If anyone can improve or refine it, please feel free to fork the project. I just wanted to share this card in case others might find it useful.

### Configuration Options
#### Layout & Display
| Option                 | Type          | Default           | Description                                                                       |
| ---------------------- | ------------- | ----------------- | --------------------------------------------------------------------------------- |
| **title**              | string        | `"Scene Presets"` | Card header. Set to `null` or `""` to hide it.                                    |
| **columns**            | number        | 2                 | Fix the number of grid columns instead of auto-fill.                              |
| **show_background**    | boolean       | `true`            | Removes card background, border and shadow when set to `false` (useful in grids). |

#### Control Visibility
| Option                       | Type    | Default | Description                                                                                                |
| ---------------------------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| **show_controls**            | boolean | `true`  | **Master toggle** — when set to `false`, *all* controls are hidden regardless of individual toggles below. |
| **show_brightness_controls** | boolean | `true`  | Show/hide the “Custom Brightness” switch and brightness slider.                                            |
| **show_transition_controls** | boolean | `true`  | Show/hide the transition duration slider.                                                                  |
| **show_interval_controls**   | boolean | `true`  | Show/hide the interval slider.                                                                             |

#### Default Control Values
| Option                        | Type    | Default | Description                                        |
| ----------------------------- | ------- | ------- | -------------------------------------------------- |
| **default_transition**        | number  | `2`     | Default transition time (seconds).                 |
| **default_interval**          | number  | `60`    | Default interval duration (seconds).               |
| **default_brightness**        | number  | `200`   | Default brightness (0–255).                        |
| **default_custom_brightness** | boolean | `false` | Whether “Custom Brightness” is enabled by default. |

#### Interaction & UX
| Option              | Type    | Default | Description                                         |
| ------------------- | ------- | ------- | --------------------------------------------------- |
| **haptic_feedback** | boolean | `false` | Trigger light haptic/vibration when tapping a tile. |

#### Service Call
| Option           | Type               | Default                               | Description                                                                                                                |
| ---------------- | ------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **service**      | string             | `"scene_presets.start_dynamic_scene"` | Service to call when tapping a preset tile. Format: `"domain.service"`.                                                    |
| **service_data** | object             | `{ preset_id: "{{id}}" }`             | Template-expanded fields passed into the service. Supports: `{{id}}`, `{{name}}`, `{{category}}`, `{{img}}`, `{{custom}}`. |


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
