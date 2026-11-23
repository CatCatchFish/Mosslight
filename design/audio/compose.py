"""Render the original music and sampled sound effects for 微光防线.

Requires NumPy. Full soundtrack renders also use macOS afconvert.
Use --sounds-only to render the sound bank into the output directory.
"""

import argparse
import subprocess
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np


RATE = 32000
TAU = 2 * np.pi


def timeline(seconds):
    return np.arange(round(seconds * RATE)) / RATE


def envelope(time, attack=0.008, release=0.04):
    return np.minimum(time / attack, 1) * np.minimum((time[-1] - time) / release, 1)


def band_noise(time, seed, low, high):
    random = np.random.default_rng(seed)
    raw = random.standard_normal(len(time))
    bins = np.fft.rfftfreq(len(time), 1 / RATE)
    low_pass = 1 / np.sqrt(1 + (bins / high) ** 6)
    high_pass = bins**2 / (bins**2 + low**2)
    shaped = np.fft.irfft(np.fft.rfft(raw) * low_pass * high_pass, n=len(time))
    return shaped / np.max(np.abs(shaped))


def noise(seconds, seed, low, high, decay, attack=0.003):
    t = timeline(seconds)
    return band_noise(t, seed, low, high) * envelope(t, attack) * np.exp(-decay * t)


def air_swish(seconds, seed, low, high, easing):
    t = timeline(seconds)
    shape = np.sin(np.pi * (t / seconds) ** easing) ** 1.7
    return band_noise(t, seed, low, high) * shape


def sweep(seconds, start, end, decay):
    t = timeline(seconds)
    curve = 7 / seconds
    phase = end * t + (start - end) * (1 - np.exp(-curve * t)) / curve
    return np.sin(TAU * phase) * np.exp(-t * decay) * envelope(t, 0.004)


def resonance(seconds, pitches, decay, attack=0.005):
    t = timeline(seconds)
    body = sum(
        amplitude * np.sin(TAU * hz * t) * np.exp(-decay * (1 + 0.3 * i) * t)
        for i, (hz, amplitude) in enumerate(pitches)
    )
    return envelope(t, attack) * body


def combine(seconds, *layers):
    signal = np.zeros(round(seconds * RATE))
    for when, level, sound in layers:
        first = round(when * RATE)
        length = min(len(signal) - first, len(sound))
        signal[first:first + length] += level * sound[:length]
    return signal


def wood_hit(seconds, pitch, seed):
    return combine(seconds,
        (0, .72, resonance(seconds, [(pitch, 1), (pitch * 2.47, .27), (pitch * 4.31, .11)], 34, .002)),
        (.006, .52, noise(seconds - .006, seed, 370, 1810, 29, .004)))


def electric_arc(seconds, start, end, seed):
    t = timeline(seconds)
    phase = TAU * (start * t + (end - start) * t**2 / (2 * seconds))
    buzz = np.sin(phase) + .39 * np.sin(2 * phase) + .14 * np.sin(3 * phase)
    flicker = .8 + .2 * np.sin(TAU * (58 * t + 80 * t**2))
    sparks = band_noise(t, seed, 490, 2220)
    return (buzz * flicker + .74 * sparks) * envelope(t, .008, seconds * .54)


def tower_foley():
    return {
        "arrow-fire": combine(.16,
            (0, .56, wood_hit(.074, 332, 201)),
            (.011, .54, sweep(.10, 521, 231, 39)),
            (.026, .89, noise(.132, 202, 534, 2270, 18, .021))),
        "arrow-hit": combine(.159,
            (0, .83, wood_hit(.107, 208, 204)),
            (.037, .37, noise(.115, 205, 390, 1520, 21, .013))),
        "cannon-fire": combine(.295,
            (0, .74, sweep(.237, 136, 58, 15)),
            (.004, 1.07, noise(.265, 206, 140, 1230, 12, .011)),
            (.027, .31, wood_hit(.17, 166, 207)),
            (.093, .31, noise(.194, 208, 360, 1750, 14, .025))),
        "cannon-hit": combine(.39,
            (0, 1, sweep(.246, 142, 65, 15)),
            (.007, .94, noise(.318, 212, 181, 1380, 13, .009)),
            (.026, .39, wood_hit(.164, 197, 213)),
            (.118, .38, noise(.27, 214, 380, 1670, 14, .021))),
        "frost-fire": combine(.171,
            (0, .51, air_swish(.151, 630, 390, 1270, 1.06)),
            (.010, .55, resonance(.122, [(362, 1), (748, .18)], 17, .022)),
            (.052, .55, resonance(.119, [(484, 1), (941, .16)], 24, .011)),
            (.105, .34, noise(.066, 631, 630, 1590, 28, .006))),
        "frost-hit": combine(.211,
            (0, .76, noise(.081, 632, 415, 1990, 38, .003)),
            (.009, .86, resonance(.105, [(627, 1), (363, .39), (1229, .15)], 31, .006)),
            (.049, .53, resonance(.116, [(477, 1), (917, .20)], 29, .006)),
            (.075, .39, noise(.084, 633, 550, 1530, 26, .009)),
            (.123, .25, air_swish(.088, 634, 530, 1330, .62))),
        "ember-fire": combine(.193,
            (0, 1, noise(.191, 224, 260, 1480, 14, .025)),
            (.015, .59, sweep(.155, 336, 113, 23)),
            (.074, .23, noise(.112, 225, 606, 1990, 32))),
        "ember-hit": combine(.269,
            (0, .58, sweep(.166, 202, 97, 25)),
            (.009, .87, noise(.214, 227, 243, 1390, 14, .018)),
            (.058, .57, wood_hit(.078, 279, 229)),
            (.108, .46, noise(.118, 230, 527, 1850, 28))),
        "storm-fire": combine(.158,
            (0, .37, noise(.101, 435, 310, 1110, 19, .015)),
            (.012, .71, electric_arc(.135, 250, 620, 436)),
            (.082, .48, noise(.058, 437, 610, 2050, 36)),
            (.112, .31, noise(.046, 438, 570, 1740, 46))),
        "storm-hit": combine(.205,
            (0, 1, noise(.049, 440, 420, 2340, 47, .002)),
            (.002, .43, sweep(.101, 215, 109, 28)),
            (.009, .67, electric_arc(.101, 567, 285, 441)),
            (.061, .61, noise(.068, 442, 560, 2210, 40)),
            (.107, .37, noise(.051, 443, 460, 1900, 43)),
            (.141, .23, noise(.064, 444, 400, 1550, 39))),
        "ballista-fire": combine(.212,
            (0, .86, wood_hit(.12, 158, 240)),
            (.037, .64, sweep(.128, 352, 118, 24)),
            (.043, .65, noise(.164, 241, 382, 1690, 16, .018))),
        "ballista-hit": combine(.251,
            (0, .81, wood_hit(.16, 163, 243)),
            (.006, .67, noise(.135, 244, 211, 1420, 21)),
            (.056, .55, wood_hit(.155, 224, 245)),
            (.098, .37, noise(.144, 246, 315, 1520, 17))),
    }


def creature_voice(seconds, start, end, formants, seed):
    t = timeline(seconds)
    progress = t / seconds
    grit = 0.017 * band_noise(t, seed + 1, 6, 37)
    pitch = (start + (end - start) * progress ** 1.12) * (1 + grit + .04 * np.sin(TAU * 7.8 * t))
    pitch += (start - end) * .27 * np.sin(np.pi * progress)
    phase = TAU * np.cumsum(pitch) / RATE
    mouth = 1.12 - .29 * progress
    voiced = np.zeros_like(t)
    for harmonic in range(1, 10):
        hz = pitch * harmonic
        vowel = sum(weight * np.exp(-((hz - center * mouth) / width) ** 2)
                    for center, width, weight in formants)
        voiced += (.17 + vowel) * np.sin(phase * harmonic + harmonic * .13) / harmonic ** 1.05
    breath = .27 * band_noise(t, seed, 320, 2200)
    effort = (1 - .59 * progress) * (1 - .16 * np.sin(TAU * 5.8 * t) ** 2)
    return (voiced + breath) * envelope(t, .034, seconds * .54) * effort


def soft_chirp(seconds, pitches, harmonics, attack=.014):
    t = timeline(seconds)
    pitch = np.interp(t / seconds, (0, .27, .61, 1), pitches)
    phase = TAU * np.cumsum(pitch) / RATE
    voice = sum(weight * np.sin((i + 1) * phase) for i, weight in enumerate(harmonics))
    shape = np.sin(np.pi / 2 * envelope(t, attack, seconds * .58)) ** 2
    return voice * shape


def creature_foley():
    return {
        "step-ooze": combine(.216,
            (0, .78, sweep(.117, 242, 109, 22)),
            (.006, .75, noise(.122, 251, 347, 1700, 24, .009)),
            (.05, .54, sweep(.107, 405, 225, 37)),
            (.086, .35, noise(.119, 252, 600, 1870, 23, .016))),
        "step-scurry": combine(.154,
            (0, .82, noise(.086, 253, 640, 2180, 38)),
            (.039, .51, wood_hit(.088, 314, 254)),
            (.067, .62, noise(.087, 255, 500, 2010, 35))),
        "step-bark": combine(.21,
            (0, .84, wood_hit(.165, 173, 257)),
            (.058, .61, noise(.152, 258, 301, 1740, 22, .012))),
        "step-shell": combine(.174,
            (0, .73, wood_hit(.077, 434, 259)),
            (.041, .52, wood_hit(.079, 361, 260)),
            (.075, .31, noise(.095, 261, 430, 1470, 25))),
        "step-frog": combine(.268,
            (0, .65, sweep(.104, 248, 150, 30)),
            (.012, .86, noise(.133, 730, 340, 1630, 21, .009)),
            (.048, .36, soft_chirp(.105, (255, 373, 330, 247), (1, .22, .055))),
            (.107, .51, noise(.139, 731, 510, 1550, 20, .014))),
        "step-ferry": combine(.235,
            (0, .8, air_swish(.172, 732, 230, 950, .68)),
            (.046, .43, sweep(.092, 341, 207, 30)),
            (.085, .48, noise(.15, 733, 315, 1450, 16, .024))),
        "step-weir": combine(.311,
            (0, .89, noise(.18, 734, 67, 290, 16, .013)),
            (.019, .56, sweep(.159, 175, 86, 16)),
            (.043, .8, noise(.21, 735, 285, 1180, 14, .026)),
            (.113, .33, noise(.17, 736, 680, 1750, 19, .015))),
        "step-stone": combine(.256,
            (0, .84, sweep(.147, 154, 88, 19)),
            (.019, .64, wood_hit(.144, 189, 263)),
            (.063, .72, noise(.19, 264, 280, 1550, 18, .016))),
        "step-wing": combine(.199,
            (0, .79, noise(.115, 266, 500, 1690, 12, .033)),
            (.061, .58, noise(.138, 267, 410, 1520, 15, .027))),
        "step-moth": combine(.248,
            (0, .47, air_swish(.111, 667, 275, 1050, .73)),
            (.016, .61, soft_chirp(.093, (345, 427, 405, 320), (1, .15, .028))),
            (.079, .38, air_swish(.155, 668, 355, 1180, .80)),
            (.107, .68, soft_chirp(.125, (424, 562, 519, 424), (1, .13, .024))),
            (.164, .20, air_swish(.084, 669, 405, 1220, .82))),
        "step-crystal": combine(.222,
            (0, .72, noise(.204, 269, 410, 1390, 9, .035)),
            (.053, .39, sweep(.151, 438, 263, 20))),
        "step-wisp": combine(.402,
            (0, .86, air_swish(.402, 770, 245, 980, .74)),
            (.044, .55, soft_chirp(.324, (372, 455, 418, 355), (1, .16, .04), .083)),
            (.103, .12, soft_chirp(.271, (510, 554, 505, 448), (1, .075), .087)),
            (.166, .38, air_swish(.236, 771, 420, 1260, .89))),
        "step-boss": combine(.315,
            (0, .92, sweep(.235, 151, 60, 13)),
            (.026, .62, wood_hit(.16, 135, 270)),
            (.035, .78, noise(.267, 271, 216, 1290, 12, .015))),
        "step-ram": combine(.268,
            (0, .98, noise(.172, 430, 43, 189, 24, .012)),
            (.006, .71, noise(.155, 431, 113, 426, 24, .008)),
            (.014, .77, noise(.084, 432, 520, 1750, 35, .008)),
            (.047, .53, noise(.087, 433, 364, 1230, 31, .01)),
            (.096, .33, noise(.172, 434, 279, 960, 22, .018))),
    }


def foley():
    return {
        **creature_foley(),
        "ferry-shell-break": combine(.297,
            (0, .9, wood_hit(.12, 376, 737)),
            (.024, .67, noise(.19, 738, 590, 2080, 20, .008)),
            (.06, .48, wood_hit(.09, 292, 739)),
            (.126, .41, noise(.165, 740, 314, 1400, 17, .026))),
        "weir-shell-open": combine(.43,
            (0, .82, noise(.183, 741, 180, 830, 13, .023)),
            (.071, .46, wood_hit(.115, 216, 742)),
            (.115, .52, noise(.265, 743, 270, 1320, 9, .036)),
            (.175, .65, resonance(.227, [(278, 1), (426, .21)], 13, .029))),
        "melee-impact": combine(.124,
            (0, .75, wood_hit(.093, 227, 744)),
            (.008, .58, noise(.105, 745, 430, 1550, 30, .004))),
        "weir-surge": combine(.492,
            (0, .73, noise(.194, 746, 60, 320, 16, .012)),
            (.011, .46, sweep(.185, 163, 85, 14)),
            (.039, .72, noise(.169, 747, 355, 1540, 16, .011)),
            (.113, .69, air_swish(.379, 748, 290, 1480, .62)),
            (.204, .46, air_swish(.288, 749, 500, 1800, .69))),
        "breach": combine(.56,
            (0, .95, wood_hit(.16, 177, 305)),
            (.053, .65, resonance(.24, [(349, 1), (694, .16)], 11, .031)),
            (.223, .73, resonance(.32, [(233, 1), (476, .2)], 8, .024))),
        "boss-breach": combine(.95,
            (0, .76, sweep(.632, 136, 62, 6)),
            (.066, .64, resonance(.44, [(233, 1), (350, .24)], 7, .036)),
            (.269, .76, resonance(.60, [(131, 1), (261, .28)], 6, .037)),
            (.1, .37, noise(.675, 307, 184, 1270, 7, .041))),
        "build": combine(.273,
            (0, .77, wood_hit(.116, 190, 309)),
            (.061, .73, wood_hit(.13, 287, 310)),
            (.117, .67, resonance(.151, [(440, 1), (876, .16)], 18, .011))),
        "upgrade": combine(.46,
            (0, .81, wood_hit(.12, 287, 311)),
            (.09, .68, resonance(.185, [(392, 1), (784, .17)], 13, .015)),
            (.186, .73, resonance(.27, [(587, 1), (1174, .15)], 12, .018))),
        "dispatch": combine(.445,
            (0, .56, wood_hit(.15, 201, 313)),
            (.043, .90, resonance(.218, [(262, 1), (393, .26)], 9, .034)),
            (.18, .65, resonance(.245, [(349, 1), (523, .28)], 9, .026))),
        "interact": combine(.127,
            (0, .67, wood_hit(.095, 382, 315)),
            (.034, .39, resonance(.086, [(584, 1)], 27, .009))),
        "reed-whistle": combine(.335,
            (0, .59, creature_voice(.17, 468, 419, ((570, 223, .9),), 317)),
            (.11, .67, creature_voice(.219, 554, 370, ((730, 230, .79),), 319))),
        "owl-bell": combine(.321,
            (0, .59, noise(.163, 321, 500, 1610, 15, .026)),
            (.033, .61, resonance(.244, [(392, 1), (784, .11)], 15, .016)),
            (.101, .53, resonance(.216, [(494, 1)], 20, .018))),
        "charge-windup": combine(.416,
            (0, .54, noise(.389, 323, 310, 1270, 5, .064)),
            (.039, .57, sweep(.335, 139, 294, 8)),
            (.168, .65, creature_voice(.234, 239, 161, ((406, 150, .74),), 324))),
        "shell-crack": combine(.246,
            (0, .97, wood_hit(.108, 377, 327)),
            (.051, .73, wood_hit(.116, 291, 328)),
            (.096, .62, noise(.142, 329, 500, 1680, 19, .008))),
        "core-expose": combine(.431,
            (0, .68, noise(.229, 331, 418, 1430, 7, .041)),
            (.047, .69, resonance(.281, [(349, 1), (522, .21)], 10, .032)),
            (.156, .63, resonance(.267, [(524, 1), (700, .2)], 11, .03))),
        "pine-landing": combine(.181,
            (0, .59, wood_hit(.107, 240, 333)),
            (.023, .95, noise(.141, 334, 551, 2130, 21, .009))),
        "victory": combine(1.13,
            (0, .71, resonance(.34, [(349, 1), (696, .18)], 7, .02)),
            (.13, .68, resonance(.39, [(440, 1), (880, .16)], 7, .022)),
            (.258, .75, resonance(.45, [(523, 1), (1046, .15)], 6, .025)),
            (.415, .72, resonance(.713, [(698, 1), (523, .30), (349, .18)], 5, .034))),
    }


@dataclass(frozen=True)
class Arrangement:
    bpm: int
    tonic: int
    lead: str
    accompaniment: str
    phrase: tuple[str, ...]
    bass_steps: tuple[float, ...]
    pluck_steps: tuple[float, ...]
    percussion: float


# One grid group per beat. Digits are major-scale degrees, dots are rests and
# dashes hold the preceding note. Wetland subdivides each beat into three.
ARRANGEMENTS = {
    "trail": Arrangement(124, 60, "reed", "pluck", (
        "35 65 3. 2.", "25 7. 65 2.", "13 6- 53 1.", "46 8. 65 4.",
        "35 65 35 8.", "24 6. 54 2.", "46 86 5. 4.", "57 9- 75 2.",
    ), (0, 1.5, 2.5), (0.5, 1, 2, 3.5), 0.80),
    "woods": Arrangement(136, 55, "pluck", "wood", (
        "5. 53 .5 68", "7. 95 .7 52", "68 6. 53 .1", "46 .6 85 4.",
        "53 .5 83 56", "2. 46 .6 42", "4. 86 54 68", "7. 95 72 .5",
    ), (0, 1.5, 2, 3.5), (0.5, 1, 1.75, 2.5, 3), 1.0),
    "wetland": Arrangement(112, 62, "wood", "pluck", (
        "3.5 6.5 3.. .12", "2.5 7.. 6.5 2..", "1.3 6.. 8.6 5.3", "4.6 8.6 5.. 4..",
        "3.5 8.5 3.5 6.5", "4.2 4.6 5.4 2..", "4.6 8.. 6.5 4.6", "5.7 9.. 7.5 2..",
    ), (0, 2 / 3, 2, 8 / 3), (1 / 3, 1, 5 / 3, 7 / 3, 3), 0.85),
    "frost": Arrangement(128, 57, "felt", "wood", (
        ".3 51 .3 65", "2. .5 7. 52", "13 .6 8. 53", "46 85 .6 4.",
        "35 .8 65 .3", "24 .6 46 2.", "46 8. 65 46", "57 9. 7. .2",
    ), (0, 1, 2.5, 3), (0.5, 1.5, 2, 3.5), 0.74),
}

REFRAIN_CHORDS = (1, 5, 6, 4, 1, 2, 4, 5)
BRIDGE_CHORDS = (6, 4, 1, 5, 6, 2, 4, 5)
BRIDGE = {
    2: (
        "6- .8 6. 3.", "4- .6 8. 6.", "5- 3. 1. 35", "2- .5 7. 5.",
        "6. 83 6- 53", "2. 46 5. 4.", "4. 68 6- 54", "5. 79 7- 5.",
    ),
    3: (
        "6-- .8. 6.. 3..", "4-- .6. 8.. 6..", "5-- 3.. 1.. .35", "2-- .5. 7.. 5..",
        "6.. 8.3 6-- 5.3", "2.. 4.6 5.. 4..", "4.. 6.8 6-- 5.4", "5.. 7.9 7-- 5..",
    ),
}
SCALE = (0, 2, 4, 5, 7, 9, 11)
PARTIALS = {
    "pluck": ((1, 1, 5.1), (2, 0.30, 9), (3, 0.15, 13), (4, 0.07, 20)),
    "felt": ((1, 1, 4.7), (2, 0.22, 9), (3, 0.09, 16)),
    "wood": ((1, 1, 6.4), (2, 0.09, 14), (3.94, 0.12, 24)),
    "bass": ((1, 1, 4.4), (2, 0.47, 8), (3, 0.12, 14)),
}


def degree_pitch(degree):
    octave, step = divmod(degree - 1, len(SCALE))
    return 12 * octave + SCALE[step]


def voice(seconds, midi, instrument):
    t = timeline(seconds)
    phase = TAU * 440 * 2 ** ((midi - 69) / 12) * t
    if instrument == "reed":
        phase += 0.065 * np.sin(TAU * 5 * t) * np.minimum(t / 0.28, 1)
        body = np.sin(phase) + 0.16 * np.sin(2 * phase) + 0.05 * np.sin(3 * phase)
        return envelope(t, 0.033, 0.065) * body * np.exp(-1.55 * t)

    body = sum(
        weight * np.sin(phase * ratio) * np.exp(-decay * t)
        for ratio, weight, decay in PARTIALS[instrument]
    )
    return envelope(t, 0.012, 0.065) * body


def music(name):
    arrangement = ARRANGEMENTS[name]
    beat = 60 / arrangement.bpm
    meter = 4
    subdivisions = len(arrangement.phrase[0].split()[0])
    sections = (
        (arrangement.phrase, REFRAIN_CHORDS, 1.0, 0.90),
        (arrangement.phrase, REFRAIN_CHORDS, 0.94, 1.03),
        (BRIDGE[subdivisions], BRIDGE_CHORDS, 0.87, 0.76),
        (arrangement.phrase, REFRAIN_CHORDS, 1.0, 1.0),
    )
    bars = sum(len(phrase) for phrase, _, _, _ in sections)
    length = round(bars * meter * beat * RATE)
    song = np.zeros((length, 2))

    def place(signal, at, level, pan=0):
        begin = round(at * beat * RATE)
        # Wrap note and reverb tails so the final bar flows back into the first.
        indices = (begin + np.arange(len(signal))) % length
        song[indices, 0] += signal * level * np.sqrt((1 - pan) / 2)
        song[indices, 1] += signal * level * np.sqrt((1 + pan) / 2)

    def note(pitch, at, duration, level, instrument, pan=0):
        place(voice(duration * beat, arrangement.tonic + pitch, instrument), at, level, pan)

    kick = combine(0.146,
        (0, 1, sweep(0.134, 139, 65, 23)),
        (0.002, 0.34, noise(0.091, 171, 125, 840, 31, 0.006)))
    brush = combine(0.117,
        (0, 1, noise(0.117, 173, 380, 1840, 25, 0.011)),
        (0.006, 0.37, sweep(0.089, 301, 193, 32)))
    shaker = noise(0.087, 174, 790, 2550, 28, 0.014)

    start = 0
    for section, (phrase, progression, melody_gain, groove_gain) in enumerate(sections):
        for bar, (measure, root) in enumerate(zip(phrase, progression, strict=True)):
            chord = tuple(degree_pitch(root + interval) for interval in (0, 2, 4))
            voicing = tuple(pitch % 12 - 12 for pitch in chord)
            bass_octave = -12 if arrangement.tonic + chord[0] < 60 else -24
            bass_notes = (chord[0] + bass_octave, chord[2] + bass_octave)
            for index, at in enumerate(arrangement.bass_steps):
                # Alternate root and fifth with a lighter offbeat.
                note(bass_notes[index % 2], start + at, 0.56 if index == 0 else 0.42,
                     groove_gain * (0.205 if index % 2 == 0 else 0.143), "bass")
            for index, at in enumerate(arrangement.pluck_steps):
                pitch = voicing[(bar + index) % 3]
                note(pitch, start + at + 0.014, 0.48,
                     groove_gain * (0.104 if index % 2 == 0 else 0.081),
                     arrangement.accompaniment, -0.30 + 0.13 * (index % 2))

            grid = measure.replace(" ", "")
            for step, degree in enumerate(grid):
                if degree in ".-":
                    continue
                tail = grid[step + 1:]
                held = len(tail) - len(tail.lstrip("-"))
                on_beat = step % subdivisions == 0
                at = start + step / subdivisions + (0 if on_beat else 0.02)
                duration = (1.02 + held) / subdivisions
                pitch = degree_pitch(int(degree))
                note(pitch, at, duration, melody_gain * (0.272 if on_beat else 0.225),
                     arrangement.lead, 0.12)
                if section == 1 and on_beat:
                    note(pitch - 12, at + 0.022, duration, 0.051, "felt", 0.36)
            if section in (1, 3) and bar % 2:
                note(voicing[1], start + 3 + 1 / subdivisions, 0.48, 0.091, "reed", 0.28)

            percussion = groove_gain * arrangement.percussion
            place(kick, start, percussion * 0.186)
            place(kick, start + 2, percussion * 0.128)
            place(brush, start + 1.018, percussion * 0.154, -0.16)
            place(brush, start + 3.018, percussion * 0.176, 0.16)
            for pulse in range(meter):
                place(shaker, start + pulse + (subdivisions - 1) / subdivisions,
                      percussion * (0.095 if pulse % 2 else 0.067), 0.27)
            if bar % 4 == 3:
                place(brush, start + 3 + (subdivisions - 1) / subdivisions,
                      percussion * 0.098, -0.26)
            start += meter

    # A short room bloom leaves the rhythm and battle cues clear.
    return (
        song
        + 0.10 * np.roll(song[:, ::-1], round(0.043 * RATE), axis=0)
        + 0.055 * np.roll(song, round(0.091 * RATE), axis=0)
    )


def write_wave(path, signal, peak):
    pcm = signal * (peak / np.max(np.abs(signal)))
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1 if pcm.ndim == 1 else pcm.shape[1])
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(np.round(pcm * 32767).astype("<i2").tobytes())


def render_tower_sounds(output):
    render_foley(output, tower_foley())

MONSTER_SOUNDS = (
    "reed-whistle", "owl-bell", "charge-windup", "shell-crack", "core-expose", "pine-landing",
    "ferry-shell-break", "weir-shell-open", "weir-surge", "melee-impact", "step-frog", "step-ferry", "step-weir",
    "step-ooze", "step-scurry", "step-bark", "step-shell",
    "step-stone", "step-wing", "step-moth", "step-crystal", "step-wisp", "step-boss", "step-ram",
)
CUE_PEAKS = {
    "cannon-fire": .84,
    "cannon-hit": .84,
    # Keep the launch and impact levels from the approved frost audition.
    "frost-fire": .555,
    "frost-hit": .498,
    "step-moth": .52,
    "step-wisp": .64,
}


def render_foley(output, effects):
    output.mkdir(parents=True, exist_ok=True)
    for name, signal in effects.items():
        tower = name.endswith(("-fire", "-hit"))
        peak = CUE_PEAKS.get(name, .76 if tower else .87)
        write_wave(output / (name + ".wav"), signal, peak)
        if tower or name in MONSTER_SOUNDS:
            samples = np.arange(len(signal))
            for variant, rate in enumerate((0.951, 1.045), start=2):
                positions = np.arange(round(len(signal) / rate)) * rate
                sound = np.interp(positions, samples, signal, right=0)
                write_wave(output / f"{name}-{variant}.wav", sound, peak)


def render_sounds(output):
    render_tower_sounds(output)
    render_foley(output, foley())


def render(output):
    render_sounds(output / "sounds")
    tracks = output / "music"
    tracks.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as scratch:
        for name in ARRANGEMENTS:
            source = Path(scratch) / (name + ".wav")
            score = music(name)
            # Match level between regions while leaving room for battle cues.
            rms = np.sqrt(np.mean(score * score))
            peak = min(0.80, np.max(np.abs(score)) * 10 ** (-18 / 20) / rms)
            write_wave(source, score, peak)
            subprocess.run([
                "afconvert", "-f", "m4af", "-d", "aac", "-b", "80000",
                str(source), str(tracks / (name + ".m4a")),
            ], check=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--tower-sounds-only", action="store_true")
    parser.add_argument("--monster-sounds-only", action="store_true")
    parser.add_argument("--sounds-only", action="store_true")
    args = parser.parse_args()
    if args.tower_sounds_only:
        render_tower_sounds(args.output)
    elif args.sounds_only:
        render_sounds(args.output)
    elif args.monster_sounds_only:
        effects = foley()
        render_foley(args.output, {name: effects[name] for name in MONSTER_SOUNDS})
    else:
        render(args.output)
