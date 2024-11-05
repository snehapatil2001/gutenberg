# The `@wordpress/dataviews` package

The DataViews package offers two components to work with a given dataset:

- `DataViews`: allows rendering a dataset using different types of layouts (table, grid, list) and interaction capabilities (search, filters, sorting, etc.).
- `DataForm`: allows editing the items from the same dataset.

## Installation

Install the module

```bash
npm install @wordpress/dataviews --save
```

## `DataViews`

### Usage

The component is data agnostic, it just requires the data to be an array of objects with an unique identifier — it can work with data coming from a static (e.g.: JSON file) or dynamic source (e.g.: HTTP Request). Consumers are responsible to query the data source appropiately:

![DataViews flow](https://developer.wordpress.org/files/2024/09/368600071-20aa078f-7c3d-406d-8dd0-8b764addd22a.png "DataViews flow")

```jsx
const Example = () => {
	// Declare data, fields, etc.

	return (
		<DataViews
			data={ data }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			defaultLayouts={ defaultLayouts }
			actions={ actions }
			paginationInfo={ paginationInfo }
		/>
	);
};
```

<div class="callout callout-info">At <a href="https://wordpress.github.io/gutenberg/">WordPress Gutenberg's Storybook</a> there's and <a href="https://wordpress.github.io/gutenberg/?path=/docs/dataviews-dataviews--docs">example implementation of the Dataviews component</a>.</div>

### Properties

#### `data`: `Object[]`

The dataset to work with, represented as a one-dimensional array.

Example:

```js
const data = [
	{
		id: 1,
		title: 'Title',
		author: 'Admin',
		date: '2012-04-23T18:25:43.511Z',
	},
	{
		/* ... */
	},
];
```

By default, dataviews would use each record's `id` as an unique identifier. If the records don't have a `id` property that identify them uniquely, they consumer needs to provide a `getItemId` function that returns an unique identifier for the record.

#### `fields`: `Object[]`

The fields describe the visible items for each record in the dataset.

Example:

```js
const STATUSES = [
	{ value: 'draft', label: __( 'Draft' ) },
	{ value: 'future', label: __( 'Scheduled' ) },
	{ value: 'pending', label: __( 'Pending Review' ) },
	{ value: 'private', label: __( 'Private' ) },
	{ value: 'publish', label: __( 'Published' ) },
	{ value: 'trash', label: __( 'Trash' ) },
];
const fields = [
	{
		id: 'title',
		label: 'Title',
		enableHiding: false,
	},
	{
		id: 'date',
		label: 'Date',
		render: ( { item } ) => {
			return <time>{ getFormattedDate( item.date ) }</time>;
		},
	},
	{
		id: 'author',
		label: __( 'Author' ),
		render: ( { item } ) => {
			return <a href="...">{ item.author }</a>;
		},
		elements: [
			{ value: 1, label: 'Admin' },
			{ value: 2, label: 'User' },
		],
		filterBy: {
			operators: [ 'is', 'isNot' ],
		},
		enableSorting: false,
	},
	{
		id: 'status',
		label: __( 'Status' ),
		getValue: ( { item } ) =>
			STATUSES.find( ( { value } ) => value === item.status )?.label ??
			item.status,
		elements: STATUSES,
		filterBy: {
			operators: [ 'isAny' ],
		},
		enableSorting: false,
	},
];
```

Each field is an object with the following properties:

-   `id`: identifier for the field. Unique.
-   `type`: the type of the field. See "Field types" section.
-   `label`: the field's name to be shown in the UI.
-   `header`: defaults to the label. Allows providing a React element to render the field labels.
-   `getValue`: function that returns the value of the field, defaults to `field[id]`.
-   `render`: function that renders the field. Optional, `getValue` will be used if `render` is not defined.
-   `Edit`: function that renders an edit control for the field. Alternatively, can provide a string declaring one of default controls provided by DataForm `text`, `integer`, `datetime`, `radio`, `select`.
-   `sort`: a compare function that determines the order of the records.
-   `isValid`: callback to decide if a field should be displayed.
-   `isVisible`: callback to decide if a field should be visible.
-   `enableSorting`: whether the data can be sorted by the given field. True by default.
-   `enableHiding`: whether the field can be hidden. True by default.
-   `enableGlobalSearch`: whether the field is searchable. False by default.
-   <code id="fields-elements">elements</code>: The list of options to pick from when using the field as a filter or when editing (DataForm component). Providing a list of to the field automatically creates a filter for it. It expects an array of objects with the following properties:
    -   `value`: The id of the value to filter to (for internal use)
    -   `label`: The text that will be displayed in the UI for the item.
    -   `description`: A longer description that describes the element, to also be displayed. Optional.
-   `filterBy`: configuration for the filters enabled by the `elements` property.
    -   `operators`: the list of operators supported by the field. See "Filter operators" below.
    -   `isPrimary`: whether it is a primary filter. A primary filter is always visible and is not listed in the "Add filter" component, except for the list layout where it behaves like a secondary filter.

##### Field types

Current supported types include: `text`, `integer`, `datetime`.

If a field declares a `type` the `sort`, `isValid`, and `Edit` functions will be provided with default implementations. They will overriden if the field provides its own.

##### Filter operators


| Operator   | Selection      | Description                                                             | Example                                            |
| ---------- | -------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| `is`       | Single item    | `EQUAL TO`. The item's field is equal to a single value.                | Author is Admin                                    |
| `isNot`    | Single item    | `NOT EQUAL TO`. The item's field is not equal to a single value.        | Author is not Admin                                |
| `isAny`    | Multiple items | `OR`. The item's field is present in a list of values.                  | Author is any: Admin, Editor                       |
| `isNone`   | Multiple items | `NOT OR`. The item's field is not present in a list of values.          | Author is none: Admin, Editor                      |
| `isAll`    | Multiple items | `AND`. The item's field has all of the values in the list.              | Category is all: Book, Review, Science Fiction     |
| `isNotAll` | Multiple items | `NOT AND`. The item's field doesn't have all of the values in the list. | Category is not all: Book, Review, Science Fiction |

`is` and `isNot` are single-selection operators, while `isAny`, `isNone`, `isAll`, and `isNotALl` are multi-selection. By default, a filter with no operators declared will support the `isAny` and `isNone` multi-selection operators. A filter cannot mix single-selection & multi-selection operators; if a single-selection operator is present in the list of valid operators, the multi-selection ones will be discarded and the filter won't allow selecting more than one item.

#### `view`: `Object`

The view object configures how the dataset is visible to the user.

Example:

```js
const view = {
	type: 'table',
	search: '',
	filters: [
		{ field: 'author', operator: 'is', value: 2 },
		{ field: 'status', operator: 'isAny', value: [ 'publish', 'draft' ] },
	],
	page: 1,
	perPage: 5,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	fields: [ 'author', 'status' ],
	layout: {},
};
```

Properties:

-   `type`: view type, one of `table`, `grid`, `list`. See "Layout types".
-   `search`: the text search applied to the dataset.
-   `filters`: the filters applied to the dataset. Each item describes:
    -   `field`: which field this filter is bound to.
    -   `operator`: which type of filter it is. See "Operator types".
    -   `value`: the actual value selected by the user.
-   `perPage`: number of records to show per page.
-   `page`: the page that is visible.
-   `sort`:

    -   `field`: the field used for sorting the dataset.
    -   `direction`: the direction to use for sorting, one of `asc` or `desc`.

-   `fields`: a list of field `id` that are visible in the UI and the specific order in which they are displayed.
-   `layout`: config that is specific to a particular layout type.

##### Properties of `layout`

| Properties of `layout`                                                                                          | Table | Grid | List |
| --------------------------------------------------------------------------------------------------------------- | ----- | ---- | ---- |
| `primaryField`: the field's `id` to be highlighted in each layout. It's not hidable.                            | ✓     | ✓    | ✓    |
| `mediaField`: the field's `id` to be used for rendering each card's media. It's not hiddable.                   |       | ✓    | ✓    |
| `columnFields`: a list of field's `id` to render vertically stacked instead of horizontally (the default).      |       | ✓    |      |
| `badgeFields`: a list of field's `id` to render without label and styled as badges.                             |       | ✓    |      |
| `combinedFields`: a list of "virtual" fields that are made by combining others. See "Combining fields" section. | ✓     |      |      |
| `styles`: additional `width`, `maxWidth`, `minWidth` styles for each field column.                              | ✓     |      |      |

##### Combining fields

The `table` layout has the ability to create "virtual" fields that are made out by combining existing ones.

Each "virtual field", has to provide an `id` and `label` (optionally a `header` instead), which have the same meaning as any other field.

Additionally, they need to provide:

-   `children`: a list of field's `id` to combine
-   `direction`: how should they be stacked, `vertical` or `horizontal`

For example, this is how you'd define a `site` field which is a combination of a `title` and `description` fields, which are not displayed:

```js
{
	fields: [ 'site', 'status' ],
	layout: {
		combinedFields: [
			{
				id: 'site',
				label: 'Site',
				children: [ 'title', 'description' ],
				direction: 'vertical',
			}
		]
	}
}
```

#### `onChangeView`: `function`

Callback executed when the view has changed. It receives the new view object as a parameter.

The view is a representation of the visible state of the dataset: what type of layout is used to display it (table, grid, etc.), how the dataset is filtered, how it is sorted or paginated. It's the consumer's responsibility to use the view config to query the data provider and make sure the user decisions (sort, pagination, filters, etc.) are respected.

The following example shows how a view object is used to query the WordPress REST API via the entities abstraction. The same can be done with any other data provider.

```js
function MyCustomPageTable() {
	const [ view, setView ] = useState( {
		type: 'table',
		perPage: 5,
		page: 1,
		sort: {
			field: 'date',
			direction: 'desc',
		},
		search: '',
		filters: [
			{ field: 'author', operator: 'is', value: 2 },
			{
				field: 'status',
				operator: 'isAny',
				value: [ 'publish', 'draft' ],
			},
		],
		fields: [ 'author', 'status' ],
		layout: {},
	} );

	const queryArgs = useMemo( () => {
		const filters = {};
		view.filters.forEach( ( filter ) => {
			if ( filter.field === 'status' && filter.operator === 'isAny' ) {
				filters.status = filter.value;
			}
			if ( filter.field === 'author' && filter.operator === 'is' ) {
				filters.author = filter.value;
			}
		} );
		return {
			per_page: view.perPage,
			page: view.page,
			_embed: 'author',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			...filters,
		};
	}, [ view ] );

	const { records } = useEntityRecords( 'postType', 'page', queryArgs );

	return (
		<DataViews
			data={ records }
			view={ view }
			onChangeView={ setView }
			// ...
		/>
	);
}
```

#### `actions`: `Object[]`

Collection of operations that can be performed upon each record.

Each action is an object with the following properties:

-   `id`: string, required. Unique identifier of the action. For example, `move-to-trash`.
-   `label`: string|function, required. User facing description of the action. For example, `Move to Trash`. It can also take a function that takes the selected items as a parameter and returns a string: this can be useful to provide a dynamic label based on the selection.
-   `isPrimary`: boolean, optional. Whether the action should be listed inline (primary) or in hidden in the more actions menu (secondary).
-   `icon`: SVG element. Icon to show for primary actions. It's required for a primary action, otherwise the action would be considered secondary.
-   `isEligible`: function, optional. Whether the action can be performed for a given record. If not present, the action is considered to be eligible for all items. It takes the given record as input.
-   `isDestructive`: boolean, optional. Whether the action can delete data, in which case the UI would communicate it via red color.
-   `supportsBulk`: Whether the action can be used as a bulk action. False by default.
-   `disabled`: Whether the action is disabled. False by default.
-   `context`: where this action would be visible. One of `list`, `single`.
-   `callback`: function, required unless `RenderModal` is provided. Callback function that takes as input the list of items to operate with, and performs the required action.
-   `RenderModal`: ReactElement, optional. If an action requires that some UI be rendered in a modal, it can provide a component which takes as input the the list of `items` to operate with, `closeModal` function, and `onActionPerformed` function. When this prop is provided, the `callback` property is ignored.
-   `hideModalHeader`: boolean, optional. This property is used in combination with `RenderModal` and controls the visibility of the modal's header. If the action renders a modal and doesn't hide the header, the action's label is going to be used in the modal's header.
-   `modalHeader`: string, optional. The header of the modal.

#### `paginationInfo`: `Object`

-   `totalItems`: the total number of items in the datasets.
-   `totalPages`: the total number of pages, taking into account the total items in the dataset and the number of items per page provided by the user.

#### `search`: `boolean`

Whether the search input is enabled. `true` by default.

#### `searchLabel`: `string`

What text to show in the search input. "Search" by default.

#### `getItemId`: `function`

Function that receives an item and returns an unique identifier for it.

By default, dataviews would use each record's `id` as an unique identifier. If the records don't have a `id` property that identify them uniquely, they consumer needs to provide a `getItemId` function that returns an unique identifier for the record.

#### `isLoading`: `boolean`

Whether the data is loading. `false` by default.

#### `defaultLayouts`: `Record< string, view >`

This property provides layout information about the view types that are active. If empty, enables all layout types (see "Layout Types") with empty layout data.

For example, this is how you'd enable only the table view type:

```js
const defaultLayouts = {
	table: {
		layout: {
			primaryField: 'my-key',
		},
	},
};
```

The `defaultLayouts` property should be an object that includes properties named `table`, `grid`, or `list`. Each of these properties should contain a `layout` property, which holds the configuration for each specific layout type. Check "Properties of layout" for the full list of properties available for each layout's configuration

#### `selection`: `string[]`

The list of selected items' ids.

If `selection` and `onChangeSelection` are provided, the `DataViews` component behaves as a controlled component, otherwise, it behaves like an uncontrolled component.

#### `onChangeSelection`: `function`

Callback that signals the user selected one of more items. It receives the list of selected items' ids as a parameter.

If `selection` and `onChangeSelection` are provided, the `DataViews` component behaves as a controlled component, otherwise, it behaves like an uncontrolled component.

#### `header`: React component

React component to be rendered next to the view config button.

## `DataForm`

### Usage

```jsx
const Example = () => {
	// Declare data, fields, etc.

	return (
		<DataForm
			data={ data }
			fields={ fields }
			form={ form }
			onChange={ onChange }
		/>
	)
}
```

<div class="callout callout-info">At <a href="https://wordpress.github.io/gutenberg/">WordPress Gutenberg's Storybook</a> there's and <a href="https://wordpress.github.io/gutenberg/?path=/docs/dataviews-dataform--docs">example implementation of the DataForm component</a>.</div>

### Properties

#### `data`: `Object`

A single item to be edited.

This could be thought as as a single record coming from the `data` property of `DataViews` — though it doesn't need to be; it can be, for example, a mix of records if you support bulk editing.

#### `fields`: `Object[]`

Same as `fields` property of `DataViews`.

#### `form`: `Object[]`

- `type`: either `regular` or `panel`.
- `fields`: a list of fields ids that should be rendered.

#### `onChange`: `function`

Callback function that receives an object with the edits done by the user.

Example:

```js
const data = {
	id: 1,
	title: 'Title',
	author: 'Admin',
	date: '2012-04-23T18:25:43.511Z',
};

const onChange = ( edits ) => {
	/*
	 * edits will contain user edits.
	 * For example, if the user edited the title
	 * edits will be:
	 *
	 * {
	 *   title: 'New title'
	 * }
	 *
	 */
};

return (
	<DataForm
		data={data}
		fields={fields}
		form={form}
		onChange={onChange}
	/>
);
```

## Utilities

### `filterSortAndPaginate`

Utility to apply the view config (filters, search, sorting, and pagination) to a dataset client-side.

Parameters:

- `data`: the dataset, as described in the "data" property of DataViews.
- `view`: the view config, as described in the "view" property of DataViews.
- `fields`: the fields config, as described in the "fields" property of DataViews.

Returns an object containing:

- `data`: the new dataset, with the view config applied.
- `paginationInfo`: object containing the following properties:
	- `totalItems`: total number of items for the current view config.
	- `totalPages`: total number of pages for the current view config.

### `isItemValid`

Utility to determine whether or not the given item's value is valid according to the current fields and form config.

Parameters:

- `item`: the item, as described in the "data" property of DataForm.
- `fields`: the fields config, as described in the "fields" property of DataForm.
- `form`: the form config, as described in the "form" property of DataForm.

Returns a boolean indicating if the item is valid (true) or not (false).

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
