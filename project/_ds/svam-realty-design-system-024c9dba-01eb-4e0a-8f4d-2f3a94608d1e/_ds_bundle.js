/* @ds-bundle: {"format":3,"namespace":"SvamRealtyDesignSystem_024c9d","components":[{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"Tag","sourcePath":"components/data-display/Tag.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"PropertyCard","sourcePath":"components/real-estate/PropertyCard.jsx"}],"sourceHashes":{"components/data-display/Avatar.jsx":"a62a88dae4a0","components/data-display/Badge.jsx":"3662a644f1bf","components/data-display/Card.jsx":"7e550fa5d950","components/data-display/Tag.jsx":"0dfe91939fc2","components/forms/Button.jsx":"7d92c2507eac","components/forms/IconButton.jsx":"7bbcb77b0aed","components/forms/Input.jsx":"3f5a64f80cc6","components/forms/Select.jsx":"26714d384d8f","components/forms/Switch.jsx":"eddfbffcb673","components/navigation/Tabs.jsx":"072cbd77ab10","components/real-estate/PropertyCard.jsx":"d2fb0cc50cb0","ui_kits/portal/Dashboard.jsx":"76dd4061b9c9","ui_kits/website/Chrome.jsx":"82250a42fdef","ui_kits/website/data.js":"69afce95508c","ui_kits/website/screens.jsx":"79a1b5602be9"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SvamRealtyDesignSystem_024c9d = window.SvamRealtyDesignSystem_024c9d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data-display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: 32,
  md: 44,
  lg: 64
};

/**
 * Avatar for agents and account holders. Falls back to initials on a
 * warm sand background.
 */
function Avatar({
  src,
  name = '',
  size = 'md',
  style = {},
  ...rest
}) {
  const d = sizes[size] || 44;
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      width: d,
      height: d,
      borderRadius: '50%',
      overflow: 'hidden',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--sand-300)',
      color: 'var(--charcoal-600)',
      fontFamily: 'var(--font-display)',
      fontSize: d * 0.36,
      fontWeight: 400,
      flexShrink: 0,
      border: '1px solid var(--border-subtle)',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials || '?');
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  brand: {
    background: 'var(--terracotta-100)',
    color: 'var(--terracotta-700)'
  },
  neutral: {
    background: 'var(--sand-300)',
    color: 'var(--charcoal-600)'
  },
  sage: {
    background: 'var(--sage-100)',
    color: 'var(--sage-700)'
  },
  success: {
    background: '#E6EEDA',
    color: 'var(--success)'
  },
  warning: {
    background: '#F7EBD6',
    color: '#8A5A12'
  },
  danger: {
    background: '#F6E1DB',
    color: 'var(--danger)'
  },
  solid: {
    background: 'var(--accent)',
    color: 'var(--white)'
  },
  inverse: {
    background: 'var(--charcoal-800)',
    color: 'var(--sand-100)'
  }
};

/**
 * Small status / category label. Use for listing status (For Sale, Under Offer)
 * and metadata pills.
 */
function Badge({
  children,
  tone = 'brand',
  dot = false,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'var(--font-sans)',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '5px 10px',
      borderRadius: 'var(--radius-sm)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...tones[tone],
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'currentColor'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Generic surface container with brand elevation. Set interactive for a
 * hover lift (used by clickable cards).
 */
function Card({
  children,
  elevation = 'sm',
  interactive = false,
  padding = '24px',
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const shadows = {
    none: 'none',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)'
  };
  const lift = interactive && hover;
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: lift ? 'var(--shadow-lg)' : shadows[elevation],
      padding,
      cursor: interactive ? 'pointer' : 'default',
      transform: lift ? 'translateY(-4px)' : 'translateY(0)',
      transition: 'transform var(--dur-base) var(--ease-emphasis), box-shadow var(--dur-base) var(--ease-standard)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Feature chip / filter tag. Used for property amenities (Garden, Parking)
 * and removable active filters.
 */
function Tag({
  children,
  icon = null,
  onRemove,
  selected = false,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      fontFamily: 'var(--font-sans)',
      fontSize: '13px',
      fontWeight: 500,
      color: selected ? 'var(--white)' : 'var(--text-body)',
      background: selected ? 'var(--accent)' : 'var(--surface-card)',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-default)'}`,
      padding: '7px 13px',
      borderRadius: 'var(--radius-pill)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      color: selected ? 'var(--white)' : 'var(--text-muted)'
    }
  }, icon), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Remove",
    onClick: onRemove,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      padding: 0,
      display: 'flex',
      marginLeft: '2px',
      marginRight: '-3px',
      color: selected ? 'var(--white)' : hover ? 'var(--accent)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: {
    padding: '8px 16px',
    fontSize: '13px',
    minHeight: '36px'
  },
  md: {
    padding: '12px 24px',
    fontSize: '14px',
    minHeight: '46px'
  },
  lg: {
    padding: '15px 32px',
    fontSize: '16px',
    minHeight: '54px'
  }
};

/**
 * Svam Realty primary action button.
 * Variants: primary (solid terracotta), secondary (charcoal outline),
 * ghost (text-only), inverse (for dark/photo backgrounds).
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    letterSpacing: '0.04em',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    transition: 'background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
    whiteSpace: 'nowrap',
    ...sizes[size]
  };
  const variants = {
    primary: {
      background: 'var(--accent)',
      color: 'var(--accent-contrast)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-body)',
      borderColor: 'var(--charcoal-800)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-brand)',
      letterSpacing: '0.02em'
    },
    inverse: {
      background: 'var(--white)',
      color: 'var(--charcoal-800)'
    }
  };
  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover ? {
    primary: {
      background: 'var(--accent-hover)'
    },
    secondary: {
      background: 'var(--charcoal-800)',
      color: 'var(--white)'
    },
    ghost: {
      color: 'var(--accent-hover)'
    },
    inverse: {
      background: 'var(--sand-200)'
    }
  }[variant] : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...variants[variant],
      ...hoverStyle,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: 36,
  md: 44,
  lg: 52
};

/**
 * Square icon-only button (toggle favourite, share, map controls).
 */
function IconButton({
  children,
  label,
  variant = 'soft',
  size = 'md',
  active = false,
  disabled = false,
  onClick,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const d = sizes[size] || 44;
  const variants = {
    soft: {
      background: active ? 'var(--terracotta-100)' : 'var(--surface-card)',
      color: active ? 'var(--accent)' : 'var(--text-body)',
      border: '1px solid var(--border-default)'
    },
    solid: {
      background: 'var(--accent)',
      color: 'var(--white)',
      border: '1px solid var(--accent)'
    },
    ghost: {
      background: hover ? 'var(--sand-200)' : 'transparent',
      color: 'var(--text-body)',
      border: '1px solid transparent'
    }
  };
  const hoverSoft = hover && variant === 'soft' ? {
    borderColor: 'var(--charcoal-300)'
  } : {};
  const hoverSolid = hover && variant === 'solid' ? {
    background: 'var(--accent-hover)'
  } : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    "aria-pressed": active,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: d,
      height: d,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)',
      ...variants[variant],
      ...hoverSoft,
      ...hoverSolid,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Text input with optional label, leading icon and helper/error text.
 */
function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  iconLeft = null,
  helper,
  error,
  disabled = false,
  required = false,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const borderColor = error ? 'var(--danger)' : focus ? 'var(--accent)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--text-body)',
      letterSpacing: '0.01em'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: disabled ? 'var(--sand-200)' : 'var(--surface-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-sm)',
      padding: '0 14px',
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      transition: 'border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)'
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      color: 'var(--text-muted)'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    required: required,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: '15px',
      color: 'var(--text-body)',
      padding: '13px 0',
      minWidth: 0
    }
  }, rest))), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '12px',
      color: error ? 'var(--danger)' : 'var(--text-muted)'
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Styled native select with a brand chevron.
 */
function Select({
  label,
  id,
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: selectId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selectId,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      fontFamily: 'var(--font-sans)',
      fontSize: '15px',
      color: 'var(--text-body)',
      background: disabled ? 'var(--sand-200)' : 'var(--surface-card)',
      border: `1px solid ${focus ? 'var(--accent)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '13px 42px 13px 14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      transition: 'border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)'
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lab = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: val,
      value: val
    }, lab);
  })), /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--text-muted)",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      position: 'absolute',
      right: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "6 9 12 15 18 9"
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/**
 * On/off switch in brand terracotta.
 */
function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  style = {}
}) {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const toggle = () => {
    if (!disabled && onChange) onChange(!checked);
  };
  const control = /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    id: switchId,
    "aria-checked": checked,
    disabled: disabled,
    onClick: toggle,
    style: {
      width: 46,
      height: 26,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--accent)' : 'var(--charcoal-200)',
      border: 'none',
      padding: 3,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      position: 'relative',
      transition: 'background var(--dur-base) var(--ease-standard)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--white)',
      boxShadow: 'var(--shadow-sm)',
      transform: checked ? 'translateX(20px)' : 'translateX(0)',
      transition: 'transform var(--dur-base) var(--ease-emphasis)'
    }
  }));
  if (!label) return control;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: switchId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      fontFamily: 'var(--font-sans)',
      fontSize: '14px',
      color: 'var(--text-body)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, control, label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Underline tab bar. Controlled via value/onChange or uncontrolled with
 * defaultValue.
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  style = {}
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && (items[0].value ?? items[0])));
  const active = value !== undefined ? value : internal;
  const select = v => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: '28px',
      borderBottom: '1px solid var(--border-default)',
      ...style
    }
  }, items.map(it => {
    const v = it.value ?? it;
    const label = it.label ?? it;
    const isActive = v === active;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": isActive,
      onClick: () => select(v),
      style: {
        position: 'relative',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: '15px',
        fontWeight: isActive ? 700 : 500,
        color: isActive ? 'var(--text-strong)' : 'var(--text-muted)',
        padding: '0 0 14px',
        marginBottom: '-1px',
        transition: 'color var(--dur-base) var(--ease-standard)'
      }
    }, label, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 2,
        background: 'var(--accent)',
        transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'transform var(--dur-base) var(--ease-emphasis)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/real-estate/PropertyCard.jsx
try { (() => {
const HeartIcon = ({
  filled
}) => /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: filled ? 'currentColor' : 'none',
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
}));
const Spec = ({
  icon,
  children
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    color: 'var(--text-muted)'
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'flex',
    color: 'var(--text-subtle)'
  }
}, icon), children);
const ico = d => /*#__PURE__*/React.createElement("svg", {
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  dangerouslySetInnerHTML: {
    __html: d
  }
});

/**
 * The signature Svam Realty listing card: photo, status badge, favourite
 * toggle, price, address and bed/bath/area specs.
 */
function PropertyCard({
  image,
  status,
  statusTone = 'sage',
  price,
  title,
  address,
  beds,
  baths,
  area,
  favourite = false,
  onFavourite,
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      transform: hover ? 'translateY(-4px)' : 'translateY(0)',
      transition: 'transform var(--dur-base) var(--ease-emphasis), box-shadow var(--dur-base) var(--ease-standard)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '4 / 3',
      background: 'var(--sand-300)'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: hover ? 'scale(1.04)' : 'scale(1)',
      transition: 'transform var(--dur-slow) var(--ease-emphasis)'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--charcoal-200)'
    }
  }, ico('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>')), status && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 14,
      left: 14
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: statusTone,
    dot: true
  }, status)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      right: 12
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    label: favourite ? 'Remove from shortlist' : 'Save to shortlist',
    active: favourite,
    onClick: onFavourite
  }, /*#__PURE__*/React.createElement(HeartIcon, {
    filled: favourite
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '22px',
      color: 'var(--text-strong)',
      letterSpacing: '0.01em',
      marginBottom: '2px'
    }
  }, price), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '15px',
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '13px',
      color: 'var(--text-muted)',
      marginBottom: '14px'
    }
  }, address), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '18px',
      paddingTop: '14px',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, beds != null && /*#__PURE__*/React.createElement(Spec, {
    icon: ico('<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>')
  }, beds, " bed"), baths != null && /*#__PURE__*/React.createElement(Spec, {
    icon: ico('<path d="M4 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M4 12v3a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-3"/>')
  }, baths, " bath"), area && /*#__PURE__*/React.createElement(Spec, {
    icon: ico('<path d="M3 3h18v18H3z"/><path d="M9 3v18"/><path d="M3 9h18"/>')
  }, area))));
}
Object.assign(__ds_scope, { PropertyCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/real-estate/PropertyCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/Dashboard.jsx
try { (() => {
// My Svam — buyer account dashboard
(function () {
  const {
    Button,
    Badge,
    Tag,
    Avatar,
    IconButton,
    Switch,
    PropertyCard,
    Tabs,
    Input
  } = window.SvamRealtyDesignSystem_024c9d;
  const ico = (d, s = 20) => /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    dangerouslySetInnerHTML: {
      __html: d
    }
  });
  function NavItem({
    icon,
    label,
    active,
    badge,
    onClick
  }) {
    const [h, setH] = React.useState(false);
    return /*#__PURE__*/React.createElement("div", {
      onClick: onClick,
      onMouseEnter: () => setH(true),
      onMouseLeave: () => setH(false),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--white)' : h ? 'var(--sand-100)' : 'var(--sand-300)',
        background: active ? 'var(--accent)' : h ? 'rgba(255,255,255,0.06)' : 'transparent',
        transition: 'background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex'
      }
    }, ico(icon, 19)), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, label), badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        background: active ? 'rgba(255,255,255,0.25)' : 'var(--charcoal-600)',
        color: active ? 'var(--white)' : 'var(--sand-200)',
        fontSize: 12,
        fontWeight: 700,
        borderRadius: 999,
        padding: '1px 8px'
      }
    }, badge));
  }
  function Sidebar({
    section,
    setSection
  }) {
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        background: 'var(--charcoal-800)',
        width: 268,
        flexShrink: 0,
        padding: '26px 18px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logos/svam-realty-light.svg",
      alt: "Svam Realty",
      style: {
        height: 34,
        margin: '4px 8px 30px'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(NavItem, {
      icon: "<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\"/>",
      label: "Dashboard",
      active: section === 'dash',
      onClick: () => setSection('dash')
    }), /*#__PURE__*/React.createElement(NavItem, {
      icon: "<path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"/>",
      label: "Saved homes",
      badge: 4,
      active: section === 'saved',
      onClick: () => setSection('saved')
    }), /*#__PURE__*/React.createElement(NavItem, {
      icon: "<rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><line x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"/><line x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"/><line x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"/>",
      label: "Viewings",
      badge: 2,
      active: section === 'view',
      onClick: () => setSection('view')
    }), /*#__PURE__*/React.createElement(NavItem, {
      icon: "<path d=\"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9\"/><path d=\"M13.73 21a2 2 0 0 1-3.46 0\"/>",
      label: "Alerts",
      active: section === 'alerts',
      onClick: () => setSection('alerts')
    }), /*#__PURE__*/React.createElement(NavItem, {
      icon: "<path d=\"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z\"/><path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/>",
      label: "Help",
      onClick: () => setSection('dash')
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 8px',
        borderTop: '1px solid var(--charcoal-600)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "James Whitfield"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: 14,
        color: 'var(--sand-100)'
      }
    }, "James Whitfield"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        color: 'var(--charcoal-300)'
      }
    }, "Buyer \xB7 Chichester"))));
  }
  function Stat({
    label,
    value,
    sub
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
        boxShadow: 'var(--shadow-xs)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        color: 'var(--text-subtle)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: 8
      }
    }, label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 36,
        color: 'var(--text-strong)',
        lineHeight: 1
      }
    }, value), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        color: 'var(--text-muted)',
        marginTop: 6
      }
    }, sub));
  }
  function ViewingRow({
    when,
    title,
    address,
    agent
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '16px 0',
        borderBottom: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 58,
        height: 58,
        borderRadius: 'var(--radius-md)',
        background: 'var(--terracotta-100)',
        color: 'var(--accent)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        lineHeight: 1
      }
    }, when.day), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em'
      }
    }, when.mon)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: 15
      }
    }, title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        color: 'var(--text-muted)'
      }
    }, address, " \xB7 ", when.time)), /*#__PURE__*/React.createElement(Badge, {
      tone: "sage",
      dot: true
    }, "Confirmed"), /*#__PURE__*/React.createElement(Avatar, {
      name: agent,
      size: "sm"
    }));
  }
  function Dashboard() {
    const {
      listings
    } = window.SVAM_DATA;
    const [section, setSection] = React.useState('dash');
    const [fav, setFav] = React.useState({
      findon: true,
      mews: true,
      cottage: true,
      barn: true
    });
    const [alerts, setAlerts] = React.useState({
      new: true,
      price: true,
      open: false
    });
    const saved = listings.filter(l => fav[l.id]);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--surface-page)'
      }
    }, /*#__PURE__*/React.createElement(Sidebar, {
      section: section,
      setSection: setSection
    }), /*#__PURE__*/React.createElement("main", {
      style: {
        flex: 1,
        padding: '34px 40px 60px',
        maxWidth: 1100
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 28
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--text-brand)',
        marginBottom: 8
      }
    }, "My Svam"), /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 36,
        margin: 0
      }
    }, "Good afternoon, James")), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      iconLeft: ico('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', 16)
    }, "Browse homes")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: 18,
        marginBottom: 32
      }
    }, /*#__PURE__*/React.createElement(Stat, {
      label: "Saved homes",
      value: saved.length,
      sub: "2 reduced this week"
    }), /*#__PURE__*/React.createElement(Stat, {
      label: "Upcoming viewings",
      value: "2",
      sub: "Next: Sat 14 Jun"
    }), /*#__PURE__*/React.createElement(Stat, {
      label: "New matches",
      value: "6",
      sub: "Since you last visited"
    })), /*#__PURE__*/React.createElement("section", {
      style: {
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 26px',
        marginBottom: 32,
        boxShadow: 'var(--shadow-xs)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        margin: 0
      }
    }, "Upcoming viewings"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm"
    }, "Manage all")), /*#__PURE__*/React.createElement(ViewingRow, {
      when: {
        day: '14',
        mon: 'JUN',
        time: '11:00'
      },
      title: "Findon Estate",
      address: "Findon",
      agent: "Priya Anand"
    }), /*#__PURE__*/React.createElement(ViewingRow, {
      when: {
        day: '18',
        mon: 'JUN',
        time: '15:30'
      },
      title: "Long Barn",
      address: "Bury",
      agent: "Tom Reed"
    })), /*#__PURE__*/React.createElement("section", {
      style: {
        marginBottom: 32
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        margin: 0
      }
    }, "Saved homes"), /*#__PURE__*/React.createElement(Tabs, {
      items: ['All', 'Reduced', 'New'],
      defaultValue: "All"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: 22
      }
    }, saved.slice(0, 3).map(l => /*#__PURE__*/React.createElement(PropertyCard, {
      key: l.id,
      image: l.image,
      status: l.status,
      statusTone: l.tone,
      price: l.price,
      title: l.title,
      address: l.address,
      beds: l.beds,
      baths: l.baths,
      area: l.area,
      favourite: !!fav[l.id],
      onFavourite: () => setFav(s => ({
        ...s,
        [l.id]: !s[l.id]
      })),
      onClick: () => {}
    })))), /*#__PURE__*/React.createElement("section", {
      style: {
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 26px',
        boxShadow: 'var(--shadow-xs)'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        margin: '0 0 4px'
      }
    }, "Email alerts"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        color: 'var(--text-muted)',
        margin: '0 0 18px'
      }
    }, "West Sussex \xB7 4+ beds \xB7 up to \xA32m"), [['new', 'New homes matching your search'], ['price', 'Price reductions on saved homes'], ['open', 'Open-house & launch events']].map(([k, label]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderTop: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        color: 'var(--text-body)'
      }
    }, label), /*#__PURE__*/React.createElement(Switch, {
      checked: alerts[k],
      onChange: v => setAlerts(s => ({
        ...s,
        [k]: v
      }))
    }))))));
  }
  Object.assign(window, {
    Dashboard
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Chrome.jsx
try { (() => {
// Svam Realty website — Header & Footer chrome
(function () {
  const {
    Button
  } = window.SvamRealtyDesignSystem_024c9d;
  function NavLink({
    children,
    active,
    onClick
  }) {
    const [h, setH] = React.useState(false);
    return /*#__PURE__*/React.createElement("a", {
      onClick: onClick,
      onMouseEnter: () => setH(true),
      onMouseLeave: () => setH(false),
      style: {
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: active ? 700 : 500,
        color: active || h ? 'var(--text-strong)' : 'var(--text-muted)',
        letterSpacing: '0.01em',
        transition: 'color var(--dur-base) var(--ease-standard)',
        position: 'relative',
        paddingBottom: 4
      }
    }, children, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 2,
        background: 'var(--accent)',
        transform: active ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'transform var(--dur-base) var(--ease-emphasis)'
      }
    }));
  }
  function Header({
    onNavigate,
    current = 'home'
  }) {
    return /*#__PURE__*/React.createElement("header", {
      style: {
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(248,245,238,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: '0 var(--gutter)',
        height: 84,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 32
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logos/svam-realty-dark.svg",
      alt: "Svam Realty",
      onClick: () => onNavigate('home'),
      style: {
        height: 40,
        cursor: 'pointer'
      }
    }), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: 'flex',
        gap: 34,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(NavLink, {
      active: current === 'home' || current === 'results',
      onClick: () => onNavigate('results')
    }, "Buy"), /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => onNavigate('results')
    }, "Rent"), /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => onNavigate('results')
    }, "New Homes"), /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => onNavigate('home')
    }, "Sell"), /*#__PURE__*/React.createElement(NavLink, {
      onClick: () => onNavigate('home')
    }, "About")), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      onClick: () => onNavigate('home')
    }, "Book a valuation")));
  }
  function Footer() {
    const col = (title, items) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--terracotta-300)',
        marginBottom: 18
      }
    }, title), items.map(i => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        color: 'var(--sand-300)',
        marginBottom: 12,
        opacity: 0.85,
        cursor: 'pointer'
      }
    }, i)));
    return /*#__PURE__*/React.createElement("footer", {
      style: {
        background: 'var(--charcoal-800)',
        color: 'var(--sand-100)',
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/patterns/pattern-blossom.svg",
      alt: "",
      "aria-hidden": "true",
      style: {
        position: 'absolute',
        right: -60,
        top: -40,
        width: 320,
        opacity: 0.10,
        pointerEvents: 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: '72px var(--gutter) 40px',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
        gap: 48
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logos/svam-realty-light.svg",
      alt: "Svam Realty",
      style: {
        height: 44,
        marginBottom: 22
      }
    }), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-serif)',
        fontSize: 19,
        fontStyle: 'italic',
        lineHeight: 1.5,
        color: 'var(--sand-200)',
        maxWidth: 320,
        margin: 0
      }
    }, "Country & coastal homes across West Sussex, sold with quiet, modern care.")), col('Buy', ['Homes for sale', 'New developments', 'Sold prices', 'Areas we cover']), col('Sell', ['Book a valuation', 'Why Svam', 'Our fees', 'Marketing']), col('Company', ['About us', 'Our team', 'Journal', 'Contact'])), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 56,
        paddingTop: 28,
        borderTop: '1px solid var(--charcoal-600)',
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        color: 'var(--charcoal-300)'
      }
    }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Svam Realty"), /*#__PURE__*/React.createElement("span", null, "Privacy \xB7 Terms \xB7 Complaints"))));
  }
  Object.assign(window, {
    Header,
    Footer,
    NavLink
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
// Svam Realty — sample listing data for the website UI kit.
// Imagery uses placeholder Unsplash stock — swap for real photography.
const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
window.SVAM_DATA = {
  listings: [{
    id: 'findon',
    image: U('1564013799919-ab600027ffc6'),
    status: 'For Sale',
    tone: 'sage',
    price: '£1,950,000',
    title: 'Findon Estate',
    address: 'Findon, West Sussex',
    beds: 5,
    baths: 3,
    area: '2,400 sq ft',
    type: 'Detached',
    featured: true,
    blurb: 'A handsome five-bedroom country house set in two acres of mature gardens, moments from the South Downs.'
  }, {
    id: 'mews',
    image: U('1568605114967-8130f3a36994'),
    status: 'For Sale',
    tone: 'sage',
    price: '£1,275,000',
    title: 'The Mews House',
    address: 'Petworth, West Sussex',
    beds: 3,
    baths: 2,
    area: '1,180 sq ft',
    type: 'Mews'
  }, {
    id: 'cottage',
    image: U('1570129477492-45c003edd2be'),
    status: 'Under Offer',
    tone: 'neutral',
    price: '£865,000',
    title: 'Honeysuckle Cottage',
    address: 'Amberley, West Sussex',
    beds: 4,
    baths: 2,
    area: '1,640 sq ft',
    type: 'Period'
  }, {
    id: 'penthouse',
    image: U('1502672260266-1c1ef2d93688'),
    status: 'For Sale',
    tone: 'sage',
    price: '£2,400,000',
    title: 'Downland Penthouse',
    address: 'Chichester, West Sussex',
    beds: 3,
    baths: 3,
    area: '2,050 sq ft',
    type: 'Apartment'
  }, {
    id: 'barn',
    image: U('1512917774080-9991f1c4c750'),
    status: 'New',
    tone: 'brand',
    price: '£1,495,000',
    title: 'Long Barn',
    address: 'Bury, West Sussex',
    beds: 4,
    baths: 3,
    area: '2,200 sq ft',
    type: 'Conversion'
  }, {
    id: 'townhouse',
    image: U('1576941089067-2de3c901e126'),
    status: 'For Sale',
    tone: 'sage',
    price: '£3,200 pcm',
    title: 'Cathedral Townhouse',
    address: 'Chichester, West Sussex',
    beds: 4,
    baths: 2,
    area: '1,900 sq ft',
    type: 'Townhouse'
  }],
  gallery: [U('1564013799919-ab600027ffc6', 1400), U('1600585154340-be6161a56a0c', 700), U('1600566753086-00f18fb6b3ea', 700), U('1600607687939-ce8a6c25118c', 700)],
  agent: {
    name: 'Priya Anand',
    role: 'Director, Country Homes',
    image: U('1573496359142-b8d87734a5a2', 200),
    phone: '01243 555 018'
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

// ui_kits/website/screens.jsx
try { (() => {
// Svam Realty website — screens
(function () {
  const {
    Button,
    Input,
    Select,
    Tabs,
    Tag,
    Badge,
    Avatar,
    IconButton,
    PropertyCard
  } = window.SvamRealtyDesignSystem_024c9d;
  const Container = ({
    children,
    style
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter)',
      ...style
    }
  }, children);
  const Overline = ({
    children,
    color
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: color || 'var(--text-brand)',
      marginBottom: 16
    }
  }, children);
  const ico = (d, s = 20) => /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    dangerouslySetInnerHTML: {
      __html: d
    }
  });

  // ---------- Search bar ----------
  function SearchBar({
    onSearch,
    compact
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: compact ? 12 : 16,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '2 1 240px'
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Location",
      iconLeft: ico('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', 18),
      placeholder: "Town, village or postcode"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 130px'
      }
    }, /*#__PURE__*/React.createElement(Select, {
      label: "Type",
      placeholder: "Any",
      options: ['Detached', 'Cottage', 'Apartment', 'Townhouse', 'Conversion']
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 110px'
      }
    }, /*#__PURE__*/React.createElement(Select, {
      label: "Beds",
      placeholder: "Any",
      options: ['1+', '2+', '3+', '4+', '5+']
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 130px'
      }
    }, /*#__PURE__*/React.createElement(Select, {
      label: "Max price",
      placeholder: "No max",
      options: ['£500k', '£750k', '£1m', '£1.5m', '£2m+']
    })), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      onClick: onSearch,
      iconLeft: ico('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', 18)
    }, "Search"));
  }

  // ---------- Home ----------
  function HomeScreen({
    onNavigate
  }) {
    const {
      listings
    } = window.SVAM_DATA;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
      style: {
        position: 'relative',
        minHeight: 620,
        display: 'flex',
        alignItems: 'center',
        background: '#2a2521'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: window.SVAM_DATA.gallery[0],
      alt: "",
      "aria-hidden": "true",
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.5
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(26,23,21,0.55) 0%, rgba(26,23,21,0.35) 40%, rgba(26,23,21,0.75) 100%)'
      }
    }), /*#__PURE__*/React.createElement(Container, {
      style: {
        position: 'relative',
        width: '100%',
        paddingTop: 64,
        paddingBottom: 72
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 720
      }
    }, /*#__PURE__*/React.createElement(Overline, {
      color: "var(--terracotta-300)"
    }, "West Sussex \xB7 Est. 2009"), /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'var(--font-display)',
        color: 'var(--white)',
        fontSize: 'clamp(2.75rem,5vw,4.5rem)',
        lineHeight: 1.05,
        letterSpacing: '0.01em',
        margin: '0 0 20px'
      }
    }, "Considered homes,", /*#__PURE__*/React.createElement("br", null), "quietly well sold."), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 22,
        lineHeight: 1.5,
        color: 'var(--sand-200)',
        maxWidth: 540,
        margin: '0 0 36px'
      }
    }, "Country and coastal property across the South Downs, handled with care from first viewing to completion.")), /*#__PURE__*/React.createElement(SearchBar, {
      onSearch: () => onNavigate('results')
    }))), /*#__PURE__*/React.createElement("section", {
      style: {
        padding: 'var(--section-y) 0',
        background: 'var(--surface-page)'
      }
    }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 40
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Overline, null, "Featured homes"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(2rem,3vw,2.75rem)',
        margin: 0
      }
    }, "A selection from our portfolio")), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => onNavigate('results'),
      iconRight: ico('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>', 16)
    }, "View all homes")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 28
      }
    }, listings.slice(0, 3).map(l => /*#__PURE__*/React.createElement(PropertyCard, {
      key: l.id,
      image: l.image,
      status: l.status,
      statusTone: l.tone,
      price: l.price,
      title: l.title,
      address: l.address,
      beds: l.beds,
      baths: l.baths,
      area: l.area,
      onClick: () => onNavigate('detail', l)
    }))))), /*#__PURE__*/React.createElement("section", {
      style: {
        padding: 'var(--section-y) 0',
        background: 'var(--surface-card)'
      }
    }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 48
      }
    }, [['<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', 'Local to the bone', 'Three decades between us walking these lanes. We know which homes hold their value and why.'], ['<path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z"/>', 'A quiet, modern service', 'Considered marketing, honest advice and a single point of contact from valuation to keys.'], ['<path d="M20 6L9 17l-5-5"/>', 'Sold, not just listed', 'Most of our homes sell within the first round of viewings, at or above guide.']].map(([d, h, p]) => /*#__PURE__*/React.createElement("div", {
      key: h
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 52,
        height: 52,
        borderRadius: 'var(--radius-md)',
        background: 'var(--terracotta-100)',
        color: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
      }
    }, ico(d, 24)), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 24,
        margin: '0 0 10px'
      }
    }, h), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        lineHeight: 1.65,
        color: 'var(--text-muted)',
        margin: 0
      }
    }, p)))))), /*#__PURE__*/React.createElement("section", {
      style: {
        background: 'var(--terracotta-500)',
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/patterns/pattern-blossom.svg",
      alt: "",
      "aria-hidden": "true",
      style: {
        position: 'absolute',
        right: -40,
        bottom: -60,
        width: 380,
        opacity: 0.18
      }
    }), /*#__PURE__*/React.createElement(Container, {
      style: {
        padding: '72px var(--gutter)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 40,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Overline, {
      color: "rgba(255,255,255,0.7)"
    }, "Thinking of selling?"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: 'var(--font-display)',
        color: 'var(--white)',
        fontSize: 'clamp(2rem,3vw,2.75rem)',
        margin: 0,
        maxWidth: 560,
        lineHeight: 1.1
      }
    }, "Find out what your home is worth, with no obligation.")), /*#__PURE__*/React.createElement(Button, {
      variant: "inverse",
      size: "lg",
      onClick: () => onNavigate('home')
    }, "Book a free valuation"))));
  }

  // ---------- Results ----------
  function ResultsScreen({
    onNavigate
  }) {
    const {
      listings
    } = window.SVAM_DATA;
    const [fav, setFav] = React.useState({});
    const [tab, setTab] = React.useState('Buy');
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface-page)',
        minHeight: '70vh'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 84,
        zIndex: 20
      }
    }, /*#__PURE__*/React.createElement(Container, {
      style: {
        paddingTop: 18
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      items: ['Buy', 'Rent', 'New homes', 'Sold prices'],
      value: tab,
      onChange: setTab
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        padding: '18px 0',
        flexWrap: 'wrap',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 220px',
        maxWidth: 320
      }
    }, /*#__PURE__*/React.createElement(Input, {
      iconLeft: ico('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', 18),
      placeholder: "West Sussex"
    })), /*#__PURE__*/React.createElement(Select, {
      placeholder: "Property type",
      options: ['Any', 'Detached', 'Cottage', 'Apartment', 'Townhouse']
    }), /*#__PURE__*/React.createElement(Select, {
      placeholder: "Beds",
      options: ['Any', '2+', '3+', '4+', '5+']
    }), /*#__PURE__*/React.createElement(Select, {
      placeholder: "Price",
      options: ['Any', '£750k', '£1m', '£1.5m', '£2m+']
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: 'auto'
      }
    }, /*#__PURE__*/React.createElement(Select, {
      placeholder: "Sort: Featured",
      options: ['Featured', 'Newest', 'Price low→high', 'Price high→low']
    }))))), /*#__PURE__*/React.createElement(Container, {
      style: {
        padding: '32px var(--gutter) 72px',
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 36,
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 30,
        margin: 0
      }
    }, "Homes for sale in West Sussex"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        color: 'var(--text-muted)'
      }
    }, "\xB7 ", listings.length, " results")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(Tag, {
      selected: true
    }, "4+ beds"), /*#__PURE__*/React.createElement(Tag, {
      onRemove: () => {}
    }, "West Sussex"), /*#__PURE__*/React.createElement(Tag, null, "Garden"), /*#__PURE__*/React.createElement(Tag, null, "Period")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24
      }
    }, listings.map(l => /*#__PURE__*/React.createElement(PropertyCard, {
      key: l.id,
      image: l.image,
      status: l.status,
      statusTone: l.tone,
      price: l.price,
      title: l.title,
      address: l.address,
      beds: l.beds,
      baths: l.baths,
      area: l.area,
      favourite: !!fav[l.id],
      onFavourite: () => setFav(s => ({
        ...s,
        [l.id]: !s[l.id]
      })),
      onClick: () => onNavigate('detail', l)
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'sticky',
        top: 200,
        height: 'calc(100vh - 230px)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        background: 'var(--sage-100)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundImage: 'radial-gradient(var(--sage-300) 1.5px, transparent 1.5px)',
        backgroundSize: '22px 22px'
      }
    }, [[30, 28], [58, 40], [44, 62], [70, 70], [24, 72]].map((p, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: 'absolute',
        left: p[0] + '%',
        top: p[1] + '%',
        transform: 'translate(-50%,-100%)',
        color: 'var(--accent)'
      }
    }, ico('<path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5" fill="white"/>', 30))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 14px',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: 'var(--shadow-md)'
      }
    }, "Map view \xB7 5 homes")))));
  }

  // ---------- Detail ----------
  function DetailScreen({
    listing,
    onNavigate
  }) {
    const l = listing || window.SVAM_DATA.listings[0];
    const {
      gallery,
      agent
    } = window.SVAM_DATA;
    const [fav, setFav] = React.useState(false);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface-page)'
      }
    }, /*#__PURE__*/React.createElement(Container, {
      style: {
        paddingTop: 24
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => onNavigate('results'),
      iconLeft: ico('<polyline points="15 18 9 12 15 6"/>', 16)
    }, "Back to results")), /*#__PURE__*/React.createElement(Container, {
      style: {
        paddingTop: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 12,
        height: 460,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: gallery[0],
      alt: l.title,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: gallery[1],
      alt: "",
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: gallery[2],
      alt: "",
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(26,23,21,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--white)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: 15,
        cursor: 'pointer'
      }
    }, "+ 18 photos"))))), /*#__PURE__*/React.createElement(Container, {
      style: {
        padding: '40px var(--gutter) 80px',
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 48,
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: l.tone,
      dot: true
    }, l.status), /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, l.type)), /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 40,
        margin: '0 0 6px'
      }
    }, l.title), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        color: 'var(--text-muted)',
        margin: '0 0 20px'
      }
    }, l.address), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 28,
        padding: '20px 0',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 28
      }
    }, [['Bedrooms', l.beds], ['Bathrooms', l.baths], ['Floor area', l.area], ['Type', l.type]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
      key: k
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        color: 'var(--text-subtle)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 4
      }
    }, k), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        color: 'var(--text-strong)'
      }
    }, v)))), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 24,
        margin: '0 0 12px'
      }
    }, "About this home"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        lineHeight: 1.75,
        color: 'var(--text-body)',
        maxWidth: 620
      }
    }, l.blurb || 'A beautifully presented home in one of West Sussex’s most sought-after villages, blending period character with considered, contemporary living. Generous reception rooms open onto mature gardens, with the South Downs National Park on the doorstep.'), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 22
      }
    }, ['Garden', 'Off-street parking', 'Period features', 'South-facing', 'Outbuilding', 'EPC C'].map(f => /*#__PURE__*/React.createElement(Tag, {
      key: f,
      icon: ico('<path d="M20 6L9 17l-5-5"/>', 14)
    }, f)))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'sticky',
        top: 104
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: 28
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        color: 'var(--text-subtle)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em'
      }
    }, "Guide price"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 38,
        color: 'var(--text-strong)',
        margin: '4px 0 20px'
      }
    }, l.price), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      fullWidth: true
    }, "Book a viewing"), /*#__PURE__*/React.createElement(IconButton, {
      label: "Save",
      active: fav,
      onClick: () => setFav(!fav)
    }, ico('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>', 18))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        paddingTop: 20,
        borderTop: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: agent.name,
      src: agent.image,
      size: "lg"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: 15
      }
    }, agent.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        color: 'var(--text-muted)'
      }
    }, agent.role), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        color: 'var(--text-brand)',
        fontWeight: 600,
        marginTop: 2
      }
    }, agent.phone)))))));
  }
  Object.assign(window, {
    HomeScreen,
    ResultsScreen,
    DetailScreen,
    SearchBar
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.PropertyCard = __ds_scope.PropertyCard;

})();
