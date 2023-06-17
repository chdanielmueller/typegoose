import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useCollapsible, Collapsible } from '@docusaurus/theme-common';
import NavbarNavLink from '@theme/NavbarItem/NavbarNavLink';
import NavbarItem from '@theme/NavbarItem/DefaultNavbarItem';

// Base Copy from "swizzle @docusaurus/theme-classic NavbarItem/DropdownNavbarItem"

/**
 * Check if the provided path is of the provided versionPath
 * Assumes versionPath is either the top-level or a "versions/" path
 * @param {String} path
 * @param {String} versionPath
 * @returns {Boolean}
 */
function isActiveVersion(path, versionPath) {
  // special case for the "latest" (top-level)
  // this function only handles the top-level and "versions/" paths
  if (versionPath === '/typegoose/') {
    return versionPath === path;
  }

  return path.startsWith(versionPath);
}

/**
 * try to parse the version from the current location
 * @returns "false" if not found", otherwise the baseurl of the version
 */
function versionFromUrl() {
  const caps = /^\/typegoose\/versions\/(\d+\.x|beta)/.exec(window.location.pathname);

  if (caps) {
    return `${caps[1]}`;
  }

  return false;
}

/**
 * Helper function to share getting versions between components
 * @param props The original arguments, needs to include "label"
 */
function getVersions(props) {
  const baseUrl = '/typegoose/';
  const [versions, setVersions] = useState([]);

  useEffect(async () => {
    const current_version = props.label;
    const versions = await fetch('/typegoose/versions.json')
      .then((v) => v.json())
      .catch((err) => {
        console.log('json fetch errored, using default', err);

        const fromurl = versionFromUrl();

        // if current version is not the baseurl, add a "latest" entry alongside the current version
        if (fromurl) {
          return {
            latest: '',
            [current_version]: fromurl,
          };
        }

        // only add the current version
        return {
          [current_version]: '',
        };
      });

    setVersions(Object.entries(versions).map(([key, path]) => [key, baseUrl + path]));
  }, []);

  return versions;
}

function NavbarVersionsSelectorDesktop({ position, className, ...props }) {
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target)) {
        return;
      }

      setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('focusin', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('focusin', handleClickOutside);
    };
  }, [dropdownRef]);

  const versions = getVersions(props);

  return (
    <div
      ref={dropdownRef}
      id="versions_dropdown"
      className={clsx('navbar__item', 'dropdown', 'dropdown--hoverable', {
        'dropdown--right': position === 'right',
        'dropdown--show': showDropdown,
      })}
    >
      <NavbarNavLink
        aria-haspopup="true"
        aria-expanded={showDropdown}
        role="button"
        href="#"
        className={clsx('navbar__link', className)}
        {...props}
        onClick={props.to ? undefined : (e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setShowDropdown(!showDropdown);
          }
        }}
      >
        {/*The following label seemingly does nothing*/}
        {props.label}
      </NavbarNavLink>
      <ul className="dropdown__menu">
        {versions.map(([versionKey, versionPath], i) => (
          <NavbarItem
            isDropdownItem
            activeClassName="dropdown__link--active"
            label={versionKey}
            to={versionPath}
            key={i}
            isActive={(_, b) => isActiveVersion(b.pathname, versionPath)}
          />
        ))}
      </ul>
    </div>
  );
}

function NavbarVersionsSelectorMobile({
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  position, // Need to destructure position from props so that it doesn't get passed on.
  onClick,
  ...props
}) {
  const versions = getVersions(props);

  const { collapsed, toggleCollapsed } = useCollapsible({
    initialState: true,
  });

  return (
    <li
      className={clsx('menu__list-item', {
        'menu__list-item--collapsed': collapsed,
      })}
    >
      <NavbarNavLink
        role="button"
        className={clsx('menu__link menu__link--sublist menu__link--sublist-caret', className)}
        {...props}
        label="Versions"
        onClick={(e) => {
          e.preventDefault();
          toggleCollapsed();
        }}
      >
        {/*The following label seemingly does nothing*/}
        Versions
      </NavbarNavLink>
      <Collapsible lazy as="ul" className="menu__list" collapsed={collapsed}>
        {versions.map(([versionKey, versionPath], i) => (
          <NavbarItem
            mobile
            isDropdownItem
            onClick={onClick}
            activeClassName="menu__link--active"
            isActive={(_, b) => isActiveVersion(b.pathname, versionPath)}
            activeBasePath={versionPath}
            label={versionKey}
            to={versionPath}
            key={i}
          />
        ))}
      </Collapsible>
    </li>
  );
}

export default function NavbarVersionsSelector({ mobile = false, ...props }) {
  const Comp = mobile ? NavbarVersionsSelectorMobile : NavbarVersionsSelectorDesktop;

  return <Comp {...props} />;
}
