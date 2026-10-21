# Part 1 — Musicana ERD

```mermaid
erDiagram
    MUSICIAN }o--o{ INSTRUMENT : plays
    MUSICIAN }o--o{ SONG : performs
    ALBUM ||--|{ SONG : contains
    MUSICIAN ||--o{ ALBUM : produces

    MUSICIAN {
      int MusicianID PK
      string Name
      string Street
      string City
      string Phone
    }
    INSTRUMENT {
      int InstrumentID PK
      string Name UK
      string MusicalKey
    }
    ALBUM {
      int AlbumID PK
      string Title UK
      date CopyrightDate
      int ProducerMusicianID FK
    }
    SONG {
      int SongID PK
      string Title UK
      string Author
      int AlbumID FK
    }
    MUSICIAN_INSTRUMENT {
      int MusicianID PK,FK
      int InstrumentID PK,FK
    }
    MUSICIAN_SONG {
      int MusicianID PK,FK
      int SongID PK,FK
    }
```

## Assumptions and cardinalities
- A musician can play multiple instruments, and an instrument can be played by multiple musicians (M:N).
- A song belongs to zero or one album; an album contains one or more songs. `Song.AlbumID` can be nullable if unassigned songs are allowed.
- Every song is performed by one or more musicians; musicians may perform many songs (M:N).
- Each album has exactly one producing musician; a musician may produce zero or many albums.
- Instrument names, album titles, and song titles are unique as stated in the brief.
- `MUSICIAN_INSTRUMENT` and `MUSICIAN_SONG` are bridge tables for many-to-many relationships.
