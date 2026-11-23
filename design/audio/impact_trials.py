"""Render the three original tower sound audition mixes."""

import argparse
from pathlib import Path

import numpy as np

from compose import RATE, TAU, combine, envelope, noise, resonance, sweep, timeline, write_wave


TOWERS = ("arrow", "cannon", "frost", "ember", "storm", "ballista")


def woodland():
    """Wood, soil and vegetation, with little tonal sustain."""
    return {
        "arrow-fire": combine(0.24,
            (0, .85, resonance(.12, [(123, .66), (206, .27)], 29)),
            (.023, .98, noise(.19, 212, 520, 2500, 14, .021))),
        "arrow-hit": combine(.22,
            (0, .81, resonance(.15, [(113, .67), (211, .24)], 27)),
            (0, .95, noise(.14, 222, 170, 1760, 23)),
            (.037, .28, noise(.15, 221, 335, 2200, 19))),
        "cannon-fire": combine(.37,
            (0, .97, sweep(.27, 95, 48, 12)),
            (0, .74, noise(.35, 225, 80, 890, 12, .011))),
        "cannon-hit": combine(.52,
            (0, .99, sweep(.34, 109, 43, 15)),
            (0, 1.05, noise(.43, 229, 100, 1420, 11)),
            (.061, .34, noise(.27, 230, 211, 2200, 14, .016)),
            (.15, .2, noise(.32, 231, 150, 1070, 12, .025))),
        "frost-fire": combine(.29,
            (0, .72, noise(.26, 234, 425, 2000, 8, .037)),
            (.032, .23, sweep(.18, 382, 214, 19))),
        "frost-hit": combine(.31,
            (0, .81, noise(.13, 236, 460, 2500, 29)),
            (.02, .40, resonance(.14, [(288, .52), (481, .17)], 23)),
            (.047, .58, noise(.235, 237, 460, 2900, 18, .026))),
        "ember-fire": combine(.28,
            (0, .91, noise(.26, 240, 138, 1680, 11, .032)),
            (.05, .38, sweep(.19, 220, 88, 12))),
        "ember-hit": combine(.36,
            (0, .50, sweep(.24, 143, 59, 16)),
            (0, .83, noise(.32, 246, 183, 1750, 10)),
            (.069, .38, noise(.13, 241, 410, 3100, 20)),
            (.147, .25, noise(.15, 242, 345, 2500, 16))),
        "storm-fire": combine(.24,
            (0, .77, noise(.205, 245, 600, 2850, 16)),
            (.018, .52, resonance(.16, [(191, .52), (377, .16)], 18))),
        "storm-hit": combine(.35,
            (0, .79, noise(.23, 247, 210, 2700, 16)),
            (0, .52, sweep(.27, 241, 64, 19)),
            (.045, .63, noise(.14, 249, 250, 2110, 26)),
            (.092, .30, noise(.15, 250, 430, 2230, 21))),
        "ballista-fire": combine(.30,
            (0, .80, resonance(.21, [(107, .7), (174, .33), (285, .18)], 19)),
            (.035, .74, noise(.23, 253, 280, 2000, 12, .021))),
        "ballista-hit": combine(.32,
            (0, .82, sweep(.28, 104, 56, 20)),
            (0, .75, noise(.27, 259, 130, 1500, 17)),
            (.075, .32, resonance(.18, [(147, .66), (299, .22)], 23))),
    }


def storybook():
    """Rounded toms, soft air pops and bouncing pitch."""
    # Low, mid and high pairs keep the tower families recognizable.
    voices = {
        "arrow": (337, 162, 206, 128, .16, .25),
        "cannon": (131, 52, 118, 45, .29, .52),
        "frost": (489, 327, 392, 203, .23, .34),
        "ember": (281, 86, 233, 97, .25, .31),
        "storm": (562, 247, 431, 113, .22, .37),
        "ballista": (211, 103, 177, 70, .25, .34),
    }
    effects = {}
    for i, (tower, parameters) in enumerate(voices.items()):
        first, last, hit_first, hit_last, fire_span, hit_span = parameters
        launch = sweep(fire_span, first, last, 18)
        strike = sweep(hit_span, hit_first, hit_last, 15)
        effects[tower + "-fire"] = combine(fire_span + .04,
            (0, .92, launch),
            (0, .28, noise(fire_span, 290 + i, 196, 1000 + i * 150, 14)),
            (.045, .2, sweep(fire_span - .025, first * 1.37, last * 1.18, 30)))
        effects[tower + "-hit"] = combine(hit_span + .04,
            (0, .84, strike),
            (0, .43, noise(hit_span, 300 + i, 130, 1200 + i * 120, 16)),
            (.068 if i != 1 else .116, .34,
             sweep(hit_span - .045, hit_first * 1.08, hit_last * .71, 20)))
    return effects


def pixel_voice(seconds, frequencies, decay):
    """Short stepped changes inside a rounded, band-limited pulse."""
    t = timeline(seconds)
    step = np.minimum((t / seconds * len(frequencies)).astype(int), len(frequencies) - 1)
    hz = np.asarray(frequencies)[step]
    phase = TAU * np.cumsum(hz) / RATE
    body = np.sin(phase)
    body += 0.14 * np.sin(3 * phase) + 0.038 * np.sin(5 * phase)
    return body * np.exp(-decay * t) * envelope(t, .007, .028)


def warm_pixel():
    voices = {
        "arrow": ((410, 345, 273), (245, 190, 122), .14, .21),
        "cannon": ((178, 117, 67), (126, 88, 51, 41), .23, .46),
        "frost": ((431, 541, 642), (569, 417, 313, 311), .19, .29),
        "ember": ((313, 237, 146), (217, 156, 101, 75), .21, .28),
        "storm": ((526, 330, 467, 221), (439, 219, 298, 123), .20, .31),
        "ballista": ((270, 215, 170), (208, 157, 102, 64), .20, .29),
    }
    effects = {}
    for i, (tower, parameters) in enumerate(voices.items()):
        flight, contact, fire_span, hit_span = parameters
        effects[tower + "-fire"] = combine(fire_span,
            (0, .94, pixel_voice(fire_span, flight, 16)),
            (0, .21, noise(fire_span, 372 + i, 401, 1800, 25)))
        effects[tower + "-hit"] = combine(hit_span + .04,
            (0, .95, pixel_voice(hit_span, contact, 13)),
            (0, .46 if i == 1 else .27, noise(hit_span, 380 + i, 210, 1690, 12)),
            (.061, .20, pixel_voice(hit_span - .03, tuple(x * .64 for x in contact), 23)))
    return effects


def normalized(signal, energy):
    peak_gain = .92 / np.max(np.abs(signal))
    active_power = np.sqrt(np.sum(signal ** 2) / (.24 * RATE))
    return signal * min(peak_gain, energy / active_power)


def audition(output, slug, effects):
    # Same sequence and target loudness for each comparison, without a music bed.
    layers = []
    interval = 1.12
    samples = output / slug
    samples.mkdir(parents=True, exist_ok=True)
    for i, tower in enumerate(TOWERS):
        fired = normalized(effects[tower + "-fire"], .175 if tower == "cannon" else .14)
        hit = normalized(effects[tower + "-hit"], .21 if tower == "cannon" else .17)
        at = i * interval + .12
        layers.extend([(at, 1, fired), (at + (.43 if tower == "cannon" else .32), 1, hit)])
        write_wave(samples / (tower + "-fire.wav"), fired, .86)
        write_wave(samples / (tower + "-hit.wav"), hit, .86)
    mix = combine(interval * len(TOWERS) + .16, *layers)
    rms = np.sqrt(np.mean(mix * mix))
    peak = min(.88, np.max(np.abs(mix)) * (10 ** (-21.25 / 20)) / rms)
    write_wave(output / (slug + ".wav"), mix, peak)


if __name__ == "__main__":
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("output", type=Path)
    output = args.parse_args().output
    audition(output, "a-woodland", woodland())
    audition(output, "b-storybook", storybook())
    audition(output, "c-warm-pixel", warm_pixel())
