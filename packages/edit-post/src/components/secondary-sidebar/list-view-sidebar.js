/**
 * WordPress dependencies
 */
import { __experimentalListView as ListView } from '@wordpress/block-editor';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useFocusOnMount, useMergeRefs } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import ListViewOutline from './list-view-outline';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

export default function ListViewSidebar( { listViewToggleElement } ) {
	const { setIsListViewOpened } = useDispatch( editPostStore );

	// This hook handles focus when the sidebar first renders.
	const focusOnMountRef = useFocusOnMount( 'firstElement' );

	// When closing the list view, focus should return to the toggle button.
	const closeListView = useCallback( () => {
		setIsListViewOpened( false );
		listViewToggleElement?.focus();
	}, [ listViewToggleElement, setIsListViewOpened ] );

	const closeOnEscape = useCallback(
		( event ) => {
			if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
				event.preventDefault();
				closeListView();
			}
		},
		[ closeListView ]
	);

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the dropZoneElement updates.
	const [ dropZoneElement, setDropZoneElement ] = useState( null );
	// Tracks our current tab.
	const [ tab, setTab ] = useState( 'list-view' );

	// This ref refers to the sidebar as a whole.
	const sidebarRef = useRef();
	// This ref refers to the tab panel.
	const tabsRef = useRef();
	// This ref refers to the list view application area.
	const listViewRef = useRef();

	// Must merge the refs together so focus can be handled properly in the next function.
	const listViewContainerRef = useMergeRefs( [
		focusOnMountRef,
		listViewRef,
		setDropZoneElement,
	] );

	/*
	 * Callback function to handle list view or outline focus.
	 *
	 * @param {string} currentTab The current tab. Either list view or outline.
	 *
	 * @return void
	 */
	function handleSidebarFocus( currentTab ) {
		// Tab panel focus.
		const tabPanelFocus = focus.tabbable.find( tabsRef.current )[ 0 ];
		// List view tab is selected.
		if ( currentTab === 'list-view' ) {
			// Either focus the list view or the tab panel. Must have a fallback because the list view does not render when there are no blocks.
			const listViewApplicationFocus = focus.tabbable.find(
				listViewRef.current
			)[ 0 ];
			const listViewFocusArea = sidebarRef.current.contains(
				listViewApplicationFocus
			)
				? listViewApplicationFocus
				: tabPanelFocus;
			listViewFocusArea.focus();
			// Outline tab is selected.
		} else {
			tabPanelFocus.focus();
		}
	}

	const handleToggleListViewShortcut = useCallback( () => {
		// If the sidebar has focus, it is safe to close.
		if (
			sidebarRef.current.contains(
				sidebarRef.current.ownerDocument.activeElement
			)
		) {
			closeListView();
		} else {
			// If the list view or outline does not have focus, focus should be moved to it.
			handleSidebarFocus( tab );
		}
	}, [ closeListView, tab ] );

	// This only fires when the sidebar is open because of the conditional rendering.
	// It is the same shortcut to open but that is defined as a global shortcut and only fires when the sidebar is closed.
	useShortcut(
		'core/edit-post/toggle-list-view',
		handleToggleListViewShortcut
	);

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="edit-post-editor__document-overview-panel"
			onKeyDown={ closeOnEscape }
			ref={ sidebarRef }
		>
			<Tabs
				selectOnMove={ false }
				onSelect={ ( tabName ) => setTab( tabName ) }
			>
				<div className="edit-post-editor__document-overview-panel__header">
					<Button
						className="edit-post-editor__document-overview-panel__close-button"
						icon={ closeSmall }
						label={ __( 'Close' ) }
						onClick={ closeListView }
					/>
					<Tabs.TabList ref={ tabsRef }>
						<Tabs.Tab tabId="list-view">
							{ _x( 'List View', 'Post overview' ) }
						</Tabs.Tab>
						<Tabs.Tab tabId="outline">
							{ _x( 'Outline', 'Post overview' ) }
						</Tabs.Tab>
					</Tabs.TabList>
				</div>

				<Tabs.TabPanel
					ref={ listViewContainerRef }
					className="edit-post-editor__list-view-container"
					tabId="list-view"
					focusable={ false }
				>
					<div className="edit-post-editor__list-view-panel-content">
						<ListView dropZoneElement={ dropZoneElement } />
					</div>
				</Tabs.TabPanel>
				<Tabs.TabPanel
					className="edit-post-editor__list-view-container"
					tabId="outline"
					focusable={ false }
				>
					<ListViewOutline />
				</Tabs.TabPanel>
			</Tabs>
		</div>
	);
}
