FROM rust:1.82 AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY core/ core/
COPY backend/ backend/
COPY operator/ operator/
RUN cargo build --release --bin symbolaio-operator

FROM gcr.io/distroless/cc-debian12
COPY --from=builder /app/target/release/symbolaio-operator /
CMD ["/symbolaio-operator"]
