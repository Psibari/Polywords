import React, { useState } from 'react';
import { Image, Text } from 'react-native';

const BASE = 'https://cdn.jsdelivr.net/npm/fluentui-emoji@latest/assets/';

const PATHS: Record<string, string> = {
  '🌳': 'Deciduous Tree/3D/deciduous_tree_3d.png',
  '🔊': 'Speaker High Volume/3D/speaker_high_volume_3d.png',
  '📢': 'Loudspeaker/3D/loudspeaker_3d.png',
  '🫧': 'Bubbles/3D/bubbles_3d.png',
  '🪵': 'Wood/3D/wood_3d.png',
  '🐾': 'Paw Prints/3D/paw_prints_3d.png',
  '🪨': 'Rock/3D/rock_3d.png',
  '⛵': 'Sailboat/3D/sailboat_3d.png',
  '📣': 'Megaphone/3D/megaphone_3d.png',
  '🌸': 'Cherry Blossom/3D/cherry_blossom_3d.png',
  '🐸': 'Frog/3D/frog_3d.png',
  '💧': 'Droplet/3D/droplet_3d.png',
  '🌀': 'Cyclone/3D/cyclone_3d.png',
  '☀️': 'Sun/3D/sun_3d.png',
  '🌱': 'Seedling/3D/seedling_3d.png',
  '🤸': 'Person Cartwheeling/3D/person_cartwheeling_3d.png',
  '🌷': 'Tulip/3D/tulip_3d.png',
  '💡': 'Light Bulb/3D/light_bulb_3d.png',
  '🪶': 'Feather/3D/feather_3d.png',
  '🩵': 'Light Blue Heart/3D/light_blue_heart_3d.png',
  '🔌': 'Electric Plug/3D/electric_plug_3d.png',
  '🌟': 'Glowing Star/3D/glowing_star_3d.png',
  '🏋️': 'Person Lifting Weights/3D/person_lifting_weights_3d.png',
  '🎨': 'Artist Palette/3D/artist_palette_3d.png',
  '🕯️': 'Candle/3D/candle_3d.png',
  '🏦': 'Bank/3D/bank_3d.png',
  '🌊': 'Water Wave/3D/water_wave_3d.png',
  '✈️': 'Airplane/3D/airplane_3d.png',
  '💳': 'Credit Card/3D/credit_card_3d.png',
  '💰': 'Money Bag/3D/money_bag_3d.png',
  '🪤': 'Mouse Trap/3D/mouse_trap_3d.png',
  '🤝': 'Handshake/3D/handshake_3d.png',
  '😴': 'Sleeping Face/3D/sleeping_face_3d.png',
  '🚢': 'Ship/3D/ship_3d.png',
  '🌙': 'Crescent Moon/3D/crescent_moon_3d.png',
  '⏰': 'Alarm Clock/3D/alarm_clock_3d.png',
  '🌅': 'Sunrise/3D/sunrise_3d.png',
  '🔥': 'Fire/3D/fire_3d.png',
  '🧩': 'Puzzle Piece/3D/puzzle_piece_3d.png',
  '🏆': 'Trophy/3D/trophy_3d.png',
  '💑': 'Couple with Heart/3D/couple_with_heart_3d.png',
  '⚽': 'Soccer Ball/3D/soccer_ball_3d.png',
  '📋': 'Clipboard/3D/clipboard_3d.png',
  '🪞': 'Mirror/3D/mirror_3d.png',
  '👂': 'Ear/3D/ear_3d.png',
  '🛡️': 'Shield/3D/shield_3d.png',
  '🗺️': 'World Map/3D/world_map_3d.png',
  '📐': 'Triangular Ruler/3D/triangular_ruler_3d.png',
  '🎵': 'Musical Note/3D/musical_note_3d.png',
  '🏥': 'Hospital/3D/hospital_3d.png',
  '🐋': 'Whale/3D/whale_3d.png',
  '🔈': 'Speaker Low Volume/3D/speaker_low_volume_3d.png',
  '👋': 'Waving Hand/3D/waving_hand_3d.png',
  '🏄': 'Person Surfing/3D/person_surfing_3d.png',
  '🔄': 'Counterclockwise Arrows Button/3D/counterclockwise_arrows_button_3d.png',
  '✋': 'Raised Hand/3D/raised_hand_3d.png',
  '💦': 'Sweat Droplets/3D/sweat_droplets_3d.png',
  '💎': 'Gem Stone/3D/gem_stone_3d.png',
  '⛰️': 'Mountain/3D/mountain_3d.png',
  '🥃': 'Tumbler Glass/3D/tumbler_glass_3d.png',
  '🏖️': 'Beach with Umbrella/3D/beach_with_umbrella_3d.png',
  '💚': 'Green Heart/3D/green_heart_3d.png',
  '✅': 'Check Mark Button/3D/check_mark_button_3d.png',
  '🕳️': 'Hole/3D/hole_3d.png',
  '😊': 'Smiling Face with Smiling Eyes/3D/smiling_face_with_smiling_eyes_3d.png',
  '⛏️': 'Pick/3D/pick_3d.png',
  '💸': 'Money with Wings/3D/money_with_wings_3d.png',
  '😐': 'Neutral Face/3D/neutral_face_3d.png',
  '🧵': 'Thread/3D/thread_3d.png',
  '✨': 'Sparkles/3D/sparkles_3d.png',
  '👌': 'OK Hand/3D/ok_hand_3d.png',
  '👮': 'Police Officer/3D/police_officer_3d.png',
  '🤒': 'Face with Thermometer/3D/face_with_thermometer_3d.png',
  '😵': 'Dizzy Face/3D/dizzy_face_3d.png',
  '😎': 'Smiling Face with Sunglasses/3D/smiling_face_with_sunglasses_3d.png',
  '🤢': 'Nauseated Face/3D/nauseated_face_3d.png',
  '🥫': 'Canned Food/3D/canned_food_3d.png',
  '💪': 'Flexed Biceps/3D/flexed_biceps_3d.png',
  '🗑️': 'Wastebasket/3D/wastebasket_3d.png',
  '🍺': 'Beer Mug/3D/beer_mug_3d.png',
  '🔒': 'Locked/3D/locked_3d.png',
  '🔤': 'Input Latin Letters/3D/input_latin_letters_3d.png',
  '📦': 'Package/3D/package_3d.png',
  '⚔️': 'Crossed Swords/3D/crossed_swords_3d.png',
  '🗂️': 'Card Index Dividers/3D/card_index_dividers_3d.png',
  '🛒': 'Shopping Cart/3D/shopping_cart_3d.png',
  '⚖️': 'Balance Scale/3D/balance_scale_3d.png',
  '🍽️': 'Fork and Knife with Plate/3D/fork_and_knife_with_plate_3d.png',
  '🔁': 'Repeat Button/3D/repeat_button_3d.png',
  '🏛️': 'Classical Building/3D/classical_building_3d.png',
  '🎖️': 'Military Medal/3D/military_medal_3d.png',
  '❓': 'Red Question Mark/3D/red_question_mark_3d.png',
};

type Props = { emoji: string; size?: number };

export function FluentEmoji({ emoji, size = 32 }: Props) {
  const [failed, setFailed] = useState(false);
  const path = PATHS[emoji];

  if (!path || failed) {
    return (
      <Text style={{ fontSize: size * 0.82, lineHeight: size, textAlign: 'center' }}>
        {emoji}
      </Text>
    );
  }

  const uri = BASE + path.split('/').map(encodeURIComponent).join('/');

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      resizeMode="contain"
    />
  );
}
