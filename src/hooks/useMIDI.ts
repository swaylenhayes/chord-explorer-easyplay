import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [state, setState] = useState<MIDIState>({ isConnected: false, deviceName: null });
  const accessRef = useRef<MIDIAccess | null>(null);

  // Stable refs for callbacks so the effect doesn't re-run on every render
  const onNoteOnRef = useRef(onNoteOn);
  onNoteOnRef.current = onNoteOn;
  const onNoteOffRef = useRef(onNoteOff);
  onNoteOffRef.current = onNoteOff;

  const handleMessage = useCallback((e: MIDIMessageEvent) => {
    const data = e.data;
    if (!data || data.length < 3) return;

    const status = data[0] & 0xf0;  // strip channel nibble
    const note = data[1];
    const velocity = data[2];

    // Convert MIDI note to grid pitch index
    if (note < MIDI_LOW || note > MIDI_HIGH) return;
    const pitch = note - MIDI_LOW;

    if (status === 0x90 && velocity > 0) {
      onNoteOnRef.current(pitch);
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      onNoteOffRef.current(pitch);
    }
  }, []);

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
    if (!enabled || !navigator.requestMIDIAccess) {
      setState({ isConnected: false, deviceName: null });
      return;
    }

    let cancelled = false;

    navigator.requestMIDIAccess().then(access => {
      if (cancelled) return;
      accessRef.current = access;

      // Attach message listeners to all inputs
      for (const input of access.inputs.values()) {
        input.addEventListener('midimessage', handleMessage as EventListener);
      }

      // Track connection state
      updateConnectionState(access);

      // Handle hot-plug / unplug
      access.addEventListener('statechange', () => {
        if (cancelled) return;

        // Re-attach listeners (new devices may have appeared)
        for (const input of access.inputs.values()) {
          input.removeEventListener('midimessage', handleMessage as EventListener);
          input.addEventListener('midimessage', handleMessage as EventListener);
        }

        updateConnectionState(access);
      });
    }).catch(() => {
      // MIDI access denied or not available
      setState({ isConnected: false, deviceName: null });
    });

    return () => {
      cancelled = true;
      const access = accessRef.current;
      if (access) {
        for (const input of access.inputs.values()) {
          input.removeEventListener('midimessage', handleMessage as EventListener);
        }
      }
      accessRef.current = null;
    };
  }, [enabled, handleMessage, updateConnectionState]);

  return state;
}
