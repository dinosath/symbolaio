# Symbolaio

Symbolaio is a modern web-based application designed for managing and editing JSON schemas. It provides a user-friendly interface for creating, editing, and versioning schemas, making it easier to manage data contracts in your projects.

## Origin of the Name

The name **Symbolaio** is derived from the Greek word **συμβόλαιο** (pronounced *symvolaio*), which means **contract**. This reflects the application's purpose of managing **data contracts** in the form of JSON schemas, ensuring consistency and reliability in data exchange between systems.

## Features

- **Schema Management**: Create, edit, and delete JSON schemas.
- **Versioning**: Manage multiple versions of schemas with automatic version increment based on changes.
- **Field Management**: Add, update, and remove fields in schemas with ease.
- **Change Detection**: Detect breaking and non-breaking changes in schemas.
- **User-Friendly Interface**: Intuitive UI for managing schemas and their metadata.

## Technology Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Shadcn + TailwindCSS
- **Backend Integration**: Axios for API communication with [Apicurio Registry](https://www.apicur.io/registry/)

## Backend Integration

Symbolaio uses [Apicurio Registry](https://www.apicur.io/registry/) for storing and managing JSON schemas. Apicurio Registry is a powerful tool for managing schema versions and ensuring compatibility in distributed systems. It provides a robust API for schema storage, retrieval, and validation, which Symbolaio leverages to deliver a seamless schema management experience.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/symbolaio.git
   cd symbolaio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

### Building the Application

To build the application for production:

```bash
npm run build
```

The build output will be located in the `dist` directory.

### Running with Docker

1. Build the Docker image:
   ```bash
   docker build -t symbolaio .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 8080:80 symbolaio
   ```

3. Access the application at `http://localhost:8080`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.