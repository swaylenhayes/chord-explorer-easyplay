import { useState, useEffect, useEffectEvent, useCallback, useRef } from 'react';

/** MIDI pitch range for the EasyPlay1S 25-key grid */
const MIDI_LOW = 48;   // C3 → pitch index 0
const MIDI_HIGH = 72;  // C5 → pitch index 24

export interface MIDIState {
  isConnected: boolean;
  deviceName: string | null;
}

/**
 * Web MIDI hook for receiving note events from a physical MIDI controller.
 *
 * Converts MIDI note numbers (48-72) to pitch indices (0-24) matching
 * the EasyPlay1S grid. Notes outside that range are ignored.
 */
export function useMIDI(
  onNoteOn: (pitch: number) => void,
  onNoteOff: (pitch: number) => void,
  enabled: boolean,
): MIDIState {
  const disconnectedState: MIDIState = { isConnected: false, deviceName: null };
  const [state, setState] = useState<MIDIState>(disconnectedState);
  const accessRef = useRef<MIDIAccess | null>(null);
  const midiSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;

  const handleMessage = useEffectEvent((e: MIDIMessageEvent) => {
    const data = e.data;
    if (!data || data.length < 3) return;

    const status = data[0] & 0xf0;  // strip channel nibble
    const note = data[1];
    const velocity = data[2];

    // Convert MIDI note to grid pitch index
    if (note < MIDI_LOW || note > MIDI_HIGH) return;
    const pitch = note - MIDI_LOW;

    if (status === 0x90 && velocity > 0) {
      onNoteOn(pitch);
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      onNoteOff(pitch);
    }
  });

  const updateConnectionState = useCallback((access: MIDIAccess) => {
    let connected = false;
    let name: string | null = null;

    for (const input of access.inputs.values()) {
      if (input.state === 'connected') {
        connected = true;
        name = input.name ?? 'MIDI Device';
        break;
      }
    }

    setState({ isConnected: connected, deviceName: connected ? name : null });
  }, []);

  useEffect(() => {
    if (!enabled || !midiSupported) {
      return;
    }

    let cancelled = false;
    let cleanupAccess: (() => void) | null = null;

    navigator.requestMIDIAccess().then(access => {
      if (cancelled) return;
      accessRef.current = access;

      const midiMessageListener = ((event: Event) => {
        handleMessage(event as MIDIMessageEvent);
      }) as EventListener;

      const stateChangeListener = () => {
        if (cancelled) return;

        // Re-attach listeners (new devices may have appeared)
        for (const input of access.inputs.values()) {
          input.removeEventListener('midimessage', midiMessageListener);
          input.addEventListener('midimessage', midiMessageListener);
        }

        updateConnectionState(access);
      };

      // Attach message listeners to all inputs
      for (const input of access.inputs.values()) {
        input.addEventListener('midimessage', midiMessageListener);
      }

      // Track connection state
      updateConnectionState(access);

      // Handle hot-plug / unplug
      access.addEventListener('statechange', stateChangeListener);

      cleanupAccess = () => {
        access.removeEventListener('statechange', stateChangeListener);
        for (const input of access.inputs.values()) {
          input.removeEventListener('midimessage', midiMessageListener);
        }
      };
    }).catch(() => {
      // MIDI access denied or not available
      setState({ isConnected: false, deviceName: null });
    });

    return () => {
      cancelled = true;
      cleanupAccess?.();
      accessRef.current = null;
    };
  }, [enabled, midiSupported, updateConnectionState]);

  return enabled && midiSupported ? state : disconnectedState;
}
