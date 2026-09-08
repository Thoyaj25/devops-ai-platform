# AI Knowledge Assistant — RAG + LLM Architecture

MarketSphere is complemented by an independent **AI Knowledge Assistant** designed to demonstrate practical Generative AI and Retrieval-Augmented Generation (RAG) engineering.

The AI component is implemented as a Python-based service and is intentionally separated from the core MarketSphere control plane. This allows the project to demonstrate two complementary engineering domains:

* **MarketSphere:** DevOps, cloud, Kubernetes, Terraform, Docker, CI/CD, deployment automation
* **AI Knowledge Assistant:** RAG, embeddings, vector search, LLM inference, and grounded generation

## RAG Architecture

The AI Knowledge Assistant follows a Retrieval-Augmented Generation architecture:

```text
                    KNOWLEDGE INGESTION
                           │
                           ▼
                    Source Documents
                           │
                           ▼
                     Text Extraction
                           │
                           ▼
                        Chunking
                           │
                           ▼
                      Embeddings
                           │
                           ▼
                  ┌───────────────────┐
                  │   Vector Store    │
                  │      FAISS        │
                  └───────────────────┘
                           │
                           │
                           │
                    QUERY PIPELINE
                           │
                           ▼
                       User Query
                           │
                           ▼
                    Query Embedding
                           │
                           ▼
                  Semantic Similarity
                       Search
                           │
                           ▼
                  Relevant Documents
                           │
                           ▼
                  Retrieved Context
                           │
                           ▼
                 Context + User Query
                           │
                           ▼
                    LLM / Bedrock
                           │
                           ▼
                  Grounded Response
```

## Where Each AI Component Fits

### 1. Documents

The knowledge base contains technical information that the assistant can use when answering questions.

Example knowledge domains include:

```text
AWS
Kubernetes
Docker
Terraform
CI/CD
DevOps troubleshooting
Cloud infrastructure
```

The documents are the **source of truth** used by the retrieval pipeline.

### 2. Text Chunking

Large documents are divided into smaller chunks before embedding.

```text
Document
   │
   ├── Chunk 1
   ├── Chunk 2
   ├── Chunk 3
   ├── ...
   └── Chunk N
```

Chunking makes semantic retrieval more precise because the vector search can identify the specific section relevant to a user's question rather than retrieving an entire document.

### 3. Embeddings

Each document chunk is converted into a numerical vector representation called an **embedding**.

Conceptually:

```text
"Kubernetes pod is stuck in Pending state"
                     │
                     ▼
              Embedding Model
                     │
                     ▼
        [0.021, -0.184, 0.731, ...]
```

The same embedding process is applied to the user's query.

The system can then compare the query vector with document vectors to identify semantically similar content.

### 4. Vector Store — FAISS

The project uses **FAISS (Facebook AI Similarity Search)** as the vector search component.

```text
Document Chunks
      │
      ▼
  Embeddings
      │
      ▼
     FAISS
      │
      ▼
Similarity Search
```

FAISS allows the application to efficiently search the embedding index and retrieve the most relevant knowledge chunks.

This is the **retrieval layer** of the RAG architecture.

### 5. Retrieval

When a user submits a question, the query is converted into an embedding and searched against the FAISS index.

For example:

```text
User:
"Why is my Kubernetes pod stuck in Pending?"

                     │
                     ▼

              Query Embedding

                     │
                     ▼

               FAISS Search

                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Chunk A    Chunk B    Chunk C
       Scheduling Resources  Node capacity

                     │
                     ▼

             Relevant Context
```

The retrieved chunks provide information relevant to the question.

### 6. Context Construction

The retrieved knowledge is assembled into context for the language model.

Conceptually:

```text
User Question
      +
Retrieved Knowledge
      │
      ▼
Prompt / Context
```

This allows the LLM to generate an answer using information retrieved from the project's knowledge base rather than relying solely on its pretrained knowledge.

### 7. LLM — AWS Bedrock

The language-generation layer uses **AWS Bedrock integration**.

The LLM receives:

```text
System Instructions
        +
User Question
        +
Retrieved Context
        │
        ▼
       LLM
        │
        ▼
Generated Answer
```

AWS Bedrock provides access to foundation models through an AWS-managed API layer.

The important architectural distinction is:

```text
FAISS              → Retrieval
AWS Bedrock / LLM  → Generation
```

FAISS does **not** generate the answer.

The LLM does **not** perform the project's document retrieval by itself.

RAG connects the two:

```text
Knowledge Base
      ↓
Embeddings
      ↓
FAISS Retrieval
      ↓
Relevant Context
      ↓
AWS Bedrock / LLM
      ↓
Grounded Answer
```

## Complete RAG Request Flow

A complete user request follows this flow:

```text
┌───────────────────────┐
│       User Query      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│       FastAPI         │
│     API Endpoint      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Query Embedding     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│        FAISS          │
│  Vector Similarity    │
│       Search          │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Relevant Knowledge   │
│       Chunks          │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Context Construction │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   AWS Bedrock / LLM   │
│      Generation       │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Grounded Response   │
└───────────────────────┘
```

## Why RAG Is Used

A standard LLM can answer questions using its pretrained knowledge, but it may not know the project's private or domain-specific information.

RAG addresses this by retrieving relevant information from an external knowledge source and supplying it to the LLM at inference time.

```text
Without RAG:

Question → LLM → Answer


With RAG:

Question
   ↓
Retrieve relevant knowledge
   ↓
Add knowledge to context
   ↓
LLM
   ↓
Grounded Answer
```

This approach can improve factual grounding for domain-specific technical questions and reduce reliance on unsupported model-generated information.

## MarketSphere + AI Relationship

The overall project can be viewed as two cooperating engineering domains:

```text
                    MARKETSPHERE
             Cloud-Native DevOps Platform
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
   DevOps Control Plane          AI Knowledge Assistant
          │                             │
          │                             ▼
          │                       Python / FastAPI
          │                             │
          │                             ▼
          │                         RAG Pipeline
          │                             │
          │                    ┌────────┴────────┐
          │                    ▼                 ▼
          │                 FAISS          AWS Bedrock
          │              Retrieval            LLM
          │                    │                 │
          │                    └───────┬─────────┘
          │                            ▼
          │                      AI Response
          │
          ├── Next.js
          ├── PostgreSQL
          ├── Prisma
          ├── Redis
          ├── Worker
          ├── Docker
          ├── Kubernetes
          ├── Terraform
          └── AWS
```

The AI Knowledge Assistant is therefore a **companion GenAI component**, not a claim that the current MarketSphere dashboard itself contains a fully embedded RAG interface.

## AI Technology Stack

| Layer        | Technology                  | Responsibility           |
| ------------ | --------------------------- | ------------------------ |
| API          | Python / FastAPI            | AI service interface     |
| Documents    | Technical knowledge sources | Source knowledge         |
| Processing   | Python                      | Document processing      |
| Embeddings   | Embedding model             | Converts text to vectors |
| Vector Store | FAISS                       | Similarity search        |
| Retrieval    | RAG pipeline                | Finds relevant context   |
| LLM          | AWS Bedrock                 | Response generation      |
| Testing      | Pytest                      | Automated validation     |

## RAG vs. LLM Responsibilities

A key design principle in this architecture is separation of responsibilities:

```text
                    RAG
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   Retrieval                  Generation
        │                         │
        ▼                         ▼
   Embeddings                 LLM
        │                         │
        ▼                         ▼
      FAISS                 AWS Bedrock
```

**RAG answers:**

> "Which information should the model see?"

**The LLM answers:**

> "How should that information be transformed into a natural-language response?"

This separation makes the architecture easier to reason about, test, and extend.

## AI Validation

The AI Knowledge Assistant was tested using Pytest:

```bash
cd ai-knowledge-assistant

source .venv/bin/activate

pytest -q
```

Validation result:

```text
28 passed
```

The test suite validates the implemented Python/RAG component without requiring the entire MarketSphere AWS infrastructure to remain continuously active.

## DevOps + GenAI Engineering Value

The combined project demonstrates practical experience across two modern engineering areas:

### DevOps / Cloud

* Git and GitHub
* CI/CD
* Docker
* Amazon ECR
* AWS
* Terraform
* Kubernetes
* Amazon EKS
* PostgreSQL
* Redis
* asynchronous workers
* deployment automation
* authentication and API security
* infrastructure troubleshooting
* cloud cost management

### GenAI / RAG

* Python
* FastAPI
* document ingestion
* text chunking
* embeddings
* vector similarity search
* FAISS
* Retrieval-Augmented Generation
* context construction
* AWS Bedrock
* LLM-based generation
* automated testing

This combination demonstrates the ability to build and operate **cloud-native systems while also integrating modern GenAI/RAG architectures**.
