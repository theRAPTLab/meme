/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false; // module-wide debug flag
const F_SEL = 'selected';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Represent the state of a visual component for temporary highlighting,
 * selection, and grouping. Keeps a canonical list of allowed highlight,
 * selection, and group types
 * @property {array} highlighted - array of strings activating highlight styles
 * @property {array} selected - array of strings activating selection styles
 * @property {array} group - array of strings representing group styles
 */
class VisualState {
  constructor(refId) {
    if (typeof refId !== 'string') throw Error('VisualState requires refId string of owner');
    this.refId = refId;
    this.id = `visualstate-${refId}`;
    this.selected = new Set();
    this.highlighted = [];
    this.group = [];
    //
    this.ToggleSelect = this.ToggleSelect.bind(this);
  }

  /**
   * returns true if any selection flags are set. If a specific set of
   * flags are
   * @param  {...string} optFlags optional selection flags to test
   */
  IsSelected(...optFlags) {
    if (optFlags.length === 0) return this.selected.has(F_SEL);
    let doesHave = true;
    optFlags.forEach(arg => {
      doesHave = doesHave && this.selected.has(arg);
    });
    return doesHave;
  }

  /**
   * set selection flags
   * @param {...string} optFlags optional selection flags to set
   */
  Select(...optFlags) {
    if (optFlags.length === 0) {
      this.selected.add(F_SEL);
      if (DBG) console.log(`${this.id} default add`, this.selected);
      return;
    }
    optFlags.forEach(arg => {
      if (arg === true) {
        this.selected.add(F_SEL);
        if (DBG) console.log(`${this.id} true add`, this.selected);
      } else if (typeof arg === 'string') {
        this.selected.add(arg);
        if (DBG) console.log(`${this.id} string add`, this.selected);
      } else {
        throw Error(`${this.id} flag must be [boolean] or [string] type, not [${typeof arg}]`);
      }
    });
  }

  /**
   * unset selection flags
   * @param {...string} optFlags variable-length selection flags to unset
   */
  Deselect(...optFlags) {
    if (optFlags.length === 0) {
      this.selected.clear();
      if (DBG) console.log(`${this.id} default deleted all`, this.selected);
      return;
    }
    optFlags.forEach(arg => {
      if (arg === true) {
        this.selected.delete(F_SEL);
        if (DBG) console.log(`true delete`, this.selected);
      } else if (typeof arg === 'string') {
        this.selected.delete(arg);
        if (DBG) console.log(`${this.id} string delete`, this.selected);
      } else {
        throw Error(`${this.id} flag must be [boolean] or [string] type, not [${typeof arg}]`);
      }
    });
  }

  /**
   * toggle selection flags
   * @param {...string} optFlags optional selection flags to toggle
   */
  ToggleSelect(...optFlags) {
    // helper function
    function toggle(self, flag) {
      if (self.selected.has(flag)) {
        self.selected.delete(flag);
      } else {
        self.selected.add(flag);
      }
    }
    // default no argument is 'selected'
    if (optFlags.length === 0) {
      toggle(this, F_SEL);
      if (DBG) console.log(`${this.id} toggled state`, this.selected);
      return;
    }
    // process arg list when provided
    optFlags.forEach(arg => {
      if (arg === true) {
        toggle(this, F_SEL);
      } else if (typeof arg === 'string') {
        toggle(this, F_SEL);
      } else {
        throw Error(`${this.id} flag must be [boolean] or [string] type, not [${typeof arg}]`);
      }
    });
    if (DBG) console.log(`${this.id} toggled state`, this.selected);
  }
}

class DisplayMode {
  constructor() {
    this.feature = [];
  }
}

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { VisualState, DisplayMode };
